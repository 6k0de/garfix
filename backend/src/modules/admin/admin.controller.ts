import bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import { getAuthContext, isSuperAdminRole } from '../../lib/auth.js'
import { ensureCompanyRoles, ensureDefaultRoles } from '../../lib/defaultCatalogs.js'
import { prisma } from '../../lib/prisma.js'
import {
  createAdminAccountSchema,
  createCompanyBranchSchema,
  updateSubscriptionSchema,
} from './admin.schema.js'

const ACTIVE_STATUS_KEYS = new Set(['active', 'activo', 'activa', 'enabled', 'habilitado'])

const normalizeStatusKey = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const isActiveStatus = (value: string | null | undefined) =>
  ACTIVE_STATUS_KEYS.has(normalizeStatusKey(value))

const toNumber = (value: bigint | number | null | undefined) => {
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'number') return value
  return 0
}

const DEFAULT_INCLUDED_BRANCHES = 1
const DEFAULT_EXTRA_BRANCH_PRICE = 150

const PLAN_PRICING: Record<
  string,
  {
    includedBranches: number
    extraBranchPrice: number
  }
> = {
  BASIC: {
    includedBranches: 1,
    extraBranchPrice: 199,
  },
  PRO: {
    includedBranches: 3,
    extraBranchPrice: 149,
  },
  ENTERPRISE: {
    includedBranches: 10,
    extraBranchPrice: 99,
  },
}

const resolvePlanPricing = (planCode: string | null | undefined) => {
  const key = (planCode ?? '').trim().toUpperCase()
  return (
    PLAN_PRICING[key] ?? {
      includedBranches: DEFAULT_INCLUDED_BRANCHES,
      extraBranchPrice: DEFAULT_EXTRA_BRANCH_PRICE,
    }
  )
}

const sanitizeExtraBranchPrices = (values: Array<number | null | undefined> | null | undefined) =>
  (values ?? [])
    .map((value) => Number(value ?? 0))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((value) => Number(value.toFixed(2)))

const sumExtraBranchPrices = (values: number[]) =>
  values.reduce((total, value) => total + value, 0)

const roundToTwoDecimals = (value: number) => Number(value.toFixed(2))

class CompanyNotFoundError extends Error {
  constructor() {
    super('Company not found')
    this.name = 'CompanyNotFoundError'
  }
}

const resolveAdminRole = async () => {
  await ensureDefaultRoles()

  const role = await prisma.role.findFirst({
    where: {
      companyId: null,
      code: 'ADMIN',
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!role) {
    throw new Error('No fue posible resolver el rol Administrador.')
  }

  return role
}

interface CompanyFinancialRow {
  companyId: string
  serviceRequestsCount: bigint | number
  servicesCount: bigint | number
  totalServiceCost: number | null
  totalServiceAdvance: number | null
}

interface CompanyFinancialStats {
  serviceRequestsCount: number
  servicesCount: number
  totalServiceCost: number
  totalServiceAdvance: number
  totalServicePending: number
}

const loadCompanyFinancialStatsMap = async () => {
  const rows = await prisma.$queryRaw<CompanyFinancialRow[]>`
    SELECT
      c.id AS "companyId",
      COUNT(DISTINCT sr.id)::bigint AS "serviceRequestsCount",
      COUNT(s.id)::bigint AS "servicesCount",
      COALESCE(SUM(s.cost), 0)::double precision AS "totalServiceCost",
      COALESCE(SUM(s.advance), 0)::double precision AS "totalServiceAdvance"
    FROM "CustomerCompany" c
    LEFT JOIN "Branch" b ON b."companyId" = c.id
    LEFT JOIN "ServiceRequest" sr ON sr."branchId" = b.id
    LEFT JOIN "Service" s ON s."serviceRequestId" = sr.id
    GROUP BY c.id
  `

  return new Map<string, CompanyFinancialStats>(
    rows.map((row) => {
      const totalServiceCost = Number(row.totalServiceCost ?? 0)
      const totalServiceAdvance = Number(row.totalServiceAdvance ?? 0)

      return [
        row.companyId,
        {
          serviceRequestsCount: toNumber(row.serviceRequestsCount),
          servicesCount: toNumber(row.servicesCount),
          totalServiceCost,
          totalServiceAdvance,
          totalServicePending: Math.max(0, totalServiceCost - totalServiceAdvance),
        },
      ]
    }),
  )
}

const buildAdminAccountsReport = async (adminRoleId: string) => {
  const [companies, financialStatsMap] = await Promise.all([
    prisma.customerCompany.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        subscriptionPlan: true,
        subscriptionPrice: true,
        extraBranchPrices: true,
        branchLimit: true,
        createdAt: true,
        branches: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        users: {
          where: {
            roleId: adminRoleId,
          },
          orderBy: {
            name: 'asc',
          },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            isActive: true,
          },
        },
      },
    }),
    loadCompanyFinancialStatsMap(),
  ])

  const result = companies
    .map((company) => {
      const adminUser = company.users[0] ?? null
      if (!adminUser) return null

      const metrics = financialStatsMap.get(company.id) ?? {
        serviceRequestsCount: 0,
        servicesCount: 0,
        totalServiceCost: 0,
        totalServiceAdvance: 0,
        totalServicePending: 0,
      }

      return {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          status: company.status,
          subscriptionPlan: company.subscriptionPlan,
          subscriptionPrice: company.subscriptionPrice,
          extraBranchPrices: company.extraBranchPrices,
          branchLimit: company.branchLimit,
          usedBranches: company.branches.length,
          availableBranches: Math.max(0, company.branchLimit - company.branches.length),
          createdAt: company.createdAt,
        },
        admin: adminUser,
        branches: company.branches,
        metrics,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return result
}

export const createAdminAccount = async (req: Request, res: Response) => {
  const parsed = createAdminAccountSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos inválidos', details: parsed.error.issues })
  }

  const auth = getAuthContext(req)
  if (!auth) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para continuar.',
    })
  }

  try {
    const role = await resolveAdminRole()
    const payload = parsed.data
    const passwordHash = await bcrypt.hash(payload.password, 12)
    const normalizedEmail = payload.email.trim().toLowerCase()
    const normalizedUsername = payload.username?.trim().toLowerCase() || null
    const initialBranchName = payload.initialBranchName?.trim() || 'Sucursal principal'
    const initialBranchAddress =
      payload.initialBranchAddress?.trim() || 'Dirección pendiente'
    const normalizedExtraBranchPrices = sanitizeExtraBranchPrices(payload.extraBranchPrices)
    const planPricing = resolvePlanPricing(payload.subscriptionPlan)
    const branchLimit = Math.max(
      payload.branchLimit,
      planPricing.includedBranches + normalizedExtraBranchPrices.length,
      1,
    )

    const created = await prisma.$transaction(async (tx) => {
      const company = await tx.customerCompany.create({
        data: {
          name: payload.companyName.trim(),
          email: normalizedEmail,
          status: payload.status,
          subscriptionPlan: payload.subscriptionPlan,
          subscriptionPrice: payload.subscriptionPrice,
          extraBranchPrices: normalizedExtraBranchPrices,
          branchLimit,
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          subscriptionPlan: true,
          subscriptionPrice: true,
          extraBranchPrices: true,
          branchLimit: true,
          createdAt: true,
        },
      })

      const adminUser = await tx.user.create({
        data: {
          name: payload.name.trim(),
          email: normalizedEmail,
          username: normalizedUsername,
          password: passwordHash,
          roleId: role.id,
          companyId: company.id,
          isActive: true,
          createdById: auth.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          isActive: true,
        },
      })

      let createdBranch: { id: string; name: string; address: string } | null = null

      createdBranch = await tx.branch.create({
        data: {
          name: initialBranchName,
          address: initialBranchAddress,
          companyId: company.id,
        },
        select: {
          id: true,
          name: true,
          address: true,
        },
      })

      return {
        company,
        adminUser,
        createdBranch,
      }
    })

    await ensureCompanyRoles(created.company.id).catch((error) => {
      console.error(
        'No fue posible preparar los roles base de la nueva empresa:',
        error,
      )
    })

    return res.status(201).json(created)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'El correo o usuario ya están registrados.',
        })
      }
    }

    console.error('Error creando cuenta administrador:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAdminAccounts = async (_: Request, res: Response) => {
  try {
    const role = await resolveAdminRole()
    const result = await buildAdminAccountsReport(role.id)

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error obteniendo cuentas administradoras:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAdminOverview = async (_: Request, res: Response) => {
  try {
    const role = await resolveAdminRole()
    const records = await buildAdminAccountsReport(role.id)

    const summary = {
      clients: 0,
      activeClients: 0,
      inactiveClients: 0,
      totalBranchLimit: 0,
      usedBranches: 0,
      availableBranches: 0,
      totalSubscriptionPrice: 0,
      totalServiceQuoted: 0,
      totalServiceCollected: 0,
      totalServicePending: 0,
      totalServiceRequests: 0,
      totalServices: 0,
      estimatedIncome: 0,
    }

    const planBreakdown = new Map<
      string,
      {
        plan: string
        clients: number
        activeClients: number
        monthlyPrice: number
        totalBranchLimit: number
        usedBranches: number
        availableBranches: number
        totalServiceQuoted: number
        totalServiceCollected: number
        totalServicePending: number
      }
    >()

    for (const record of records) {
      const active = isActiveStatus(record.company.status)
      const planKey = record.company.subscriptionPlan || 'BASIC'

      summary.clients += 1
      summary.activeClients += active ? 1 : 0
      summary.inactiveClients += active ? 0 : 1
      summary.totalBranchLimit += record.company.branchLimit
      summary.usedBranches += record.company.usedBranches
      summary.availableBranches += record.company.availableBranches
      summary.totalSubscriptionPrice += record.company.subscriptionPrice
      summary.totalServiceQuoted += record.metrics.totalServiceCost
      summary.totalServiceCollected += record.metrics.totalServiceAdvance
      summary.totalServicePending += record.metrics.totalServicePending
      summary.totalServiceRequests += record.metrics.serviceRequestsCount
      summary.totalServices += record.metrics.servicesCount

      const currentPlan = planBreakdown.get(planKey) ?? {
        plan: planKey,
        clients: 0,
        activeClients: 0,
        monthlyPrice: 0,
        totalBranchLimit: 0,
        usedBranches: 0,
        availableBranches: 0,
        totalServiceQuoted: 0,
        totalServiceCollected: 0,
        totalServicePending: 0,
      }

      currentPlan.clients += 1
      currentPlan.activeClients += active ? 1 : 0
      currentPlan.monthlyPrice += record.company.subscriptionPrice
      currentPlan.totalBranchLimit += record.company.branchLimit
      currentPlan.usedBranches += record.company.usedBranches
      currentPlan.availableBranches += record.company.availableBranches
      currentPlan.totalServiceQuoted += record.metrics.totalServiceCost
      currentPlan.totalServiceCollected += record.metrics.totalServiceAdvance
      currentPlan.totalServicePending += record.metrics.totalServicePending

      planBreakdown.set(planKey, currentPlan)
    }

    summary.estimatedIncome = summary.totalSubscriptionPrice + summary.totalServiceCollected

    const topClientsByRevenue = [...records]
      .sort((a, b) => b.metrics.totalServiceAdvance - a.metrics.totalServiceAdvance)
      .slice(0, 5)
      .map((record) => ({
        companyId: record.company.id,
        companyName: record.company.name,
        subscriptionPlan: record.company.subscriptionPlan,
        monthlyPrice: record.company.subscriptionPrice,
        serviceCollected: record.metrics.totalServiceAdvance,
        serviceQuoted: record.metrics.totalServiceCost,
        totalIncome: record.company.subscriptionPrice + record.metrics.totalServiceAdvance,
      }))

    const users = records
      .map((record) => ({
        userId: record.admin.id,
        name: record.admin.name,
        email: record.admin.email ?? record.admin.username ?? '',
        companyId: record.company.id,
        companyName: record.company.name,
        subscriptionPlan: record.company.subscriptionPlan,
        branchLimit: record.company.branchLimit,
        usedBranches: record.company.usedBranches,
        availableBranches: record.company.availableBranches,
        monthlyPrice: record.company.subscriptionPrice,
        serviceCollected: record.metrics.totalServiceAdvance,
        estimatedIncome: record.company.subscriptionPrice + record.metrics.totalServiceAdvance,
      }))
      .sort((a, b) => b.usedBranches - a.usedBranches)

    return res.status(200).json({
      summary,
      plans: Array.from(planBreakdown.values()).sort((a, b) => b.clients - a.clients),
      topClientsByRevenue,
      users,
    })
  } catch (error) {
    console.error('Error obteniendo resumen superadmin:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const updateAdminSubscription = async (req: Request, res: Response) => {
  const { companyId } = req.params
  if (!companyId) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'El id de la compañía es requerido.',
    })
  }

  const parsed = updateSubscriptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos inválidos', details: parsed.error.issues })
  }

  try {
    const role = await resolveAdminRole()
    const payload = parsed.data

    const companyUpdateData: {
      subscriptionPlan?: string
      subscriptionPrice?: number
      extraBranchPrices?: number[]
      status?: string
      branchLimit?: number
    } = {}

    const updated = await prisma.$transaction(async (tx) => {
      const currentCompany = await tx.customerCompany.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          subscriptionPlan: true,
          subscriptionPrice: true,
          extraBranchPrices: true,
          branchLimit: true,
        },
      })

      if (!currentCompany) {
        throw new CompanyNotFoundError()
      }

      const currentUsedBranches = await tx.branch.count({
        where: {
          companyId,
        },
      })

      const targetPlan = (payload.subscriptionPlan ?? currentCompany.subscriptionPlan).trim()
      const planPricing = resolvePlanPricing(targetPlan)

      if (typeof payload.subscriptionPlan === 'string') {
        companyUpdateData.subscriptionPlan = targetPlan
      }

      if (typeof payload.status === 'string') {
        companyUpdateData.status = payload.status.trim()
      }

      if (Array.isArray(payload.extraBranchPrices)) {
        companyUpdateData.extraBranchPrices = sanitizeExtraBranchPrices(payload.extraBranchPrices)
      }

      const nextExtraBranchPrices =
        companyUpdateData.extraBranchPrices ?? sanitizeExtraBranchPrices(currentCompany.extraBranchPrices)

      if (typeof payload.branchLimit === 'number') {
        companyUpdateData.branchLimit = Math.max(payload.branchLimit, currentUsedBranches, 1)
      } else if (Array.isArray(payload.extraBranchPrices) || typeof payload.subscriptionPlan === 'string') {
        companyUpdateData.branchLimit = Math.max(
          currentUsedBranches,
          planPricing.includedBranches + nextExtraBranchPrices.length,
          1,
        )
      }

      const shouldRecalculatePrice =
        typeof payload.baseMonthlyPrice === 'number' ||
        Array.isArray(payload.extraBranchPrices) ||
        typeof payload.discountPercent === 'number'

      if (shouldRecalculatePrice) {
        const baseMonthlyPrice =
          typeof payload.baseMonthlyPrice === 'number'
            ? payload.baseMonthlyPrice
            : currentCompany.subscriptionPrice
        const extraBranchTotal = sumExtraBranchPrices(nextExtraBranchPrices)
        const discountPercent = Number(payload.discountPercent ?? 0)
        const safeDiscount = Math.min(Math.max(discountPercent, 0), 100)
        const subtotal = baseMonthlyPrice + extraBranchTotal
        companyUpdateData.subscriptionPrice = roundToTwoDecimals(
          subtotal - subtotal * (safeDiscount / 100),
        )
      } else if (typeof payload.subscriptionPrice === 'number') {
        companyUpdateData.subscriptionPrice = payload.subscriptionPrice
      }

      const company = await tx.customerCompany.update({
        where: { id: companyId },
        data: companyUpdateData,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          subscriptionPlan: true,
          subscriptionPrice: true,
          extraBranchPrices: true,
          branchLimit: true,
          createdAt: true,
          branches: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      if (typeof payload.isAdminActive === 'boolean') {
        await tx.user.updateMany({
          where: {
            companyId,
            roleId: role.id,
          },
          data: {
            isActive: payload.isAdminActive,
          },
        })
      }

      const admin = await tx.user.findFirst({
        where: {
          companyId,
          roleId: role.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          isActive: true,
        },
      })

      return {
        company: {
          ...company,
          usedBranches: company.branches.length,
          availableBranches: Math.max(0, company.branchLimit - company.branches.length),
        },
        admin,
      }
    })

    return res.status(200).json(updated)
  } catch (error) {
    if (
      error instanceof CompanyNotFoundError ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
    ) {
      return res.status(404).json({
        error: 'No encontrado',
        message: 'La compañía solicitada no existe.',
      })
    }

    console.error('Error actualizando suscripción de administrador:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const addBranchToCompany = async (req: Request, res: Response) => {
  const { companyId } = req.params
  if (!companyId) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'El id de la compañía es requerido.',
    })
  }

  const parsed = createCompanyBranchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos inválidos', details: parsed.error.issues })
  }

  try {
    const company = await prisma.customerCompany.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionPrice: true,
        extraBranchPrices: true,
        branchLimit: true,
      },
    })

    if (!company) {
      return res.status(404).json({
        error: 'No encontrado',
        message: 'La compañía solicitada no existe.',
      })
    }

    const usedBranches = await prisma.branch.count({
      where: {
        companyId,
      },
    })

    if (usedBranches >= company.branchLimit) {
      return res.status(409).json({
        error: 'Límite de sucursales alcanzado',
        message: `La compañía ya alcanzó su límite de ${company.branchLimit} sucursal(es).`,
      })
    }

    const nextUsedBranches = usedBranches + 1
    const planPricing = resolvePlanPricing(company.subscriptionPlan)
    const currentExtraBranchPrices = sanitizeExtraBranchPrices(company.extraBranchPrices)
    const nextExtraBranches = Math.max(0, nextUsedBranches - planPricing.includedBranches)
    const nextExtraBranchPrices = [...currentExtraBranchPrices]
    while (nextExtraBranchPrices.length < nextExtraBranches) {
      nextExtraBranchPrices.push(planPricing.extraBranchPrice)
    }

    const { branch } = await prisma.$transaction(async (tx) => {
      const createdBranch = await tx.branch.create({
        data: {
          companyId,
          name: parsed.data.name.trim(),
          address: parsed.data.address.trim(),
        },
        select: {
          id: true,
          name: true,
          address: true,
        },
      })

      if (nextExtraBranchPrices.length !== currentExtraBranchPrices.length) {
        const incrementalExtraPrice = roundToTwoDecimals(
          sumExtraBranchPrices(nextExtraBranchPrices) - sumExtraBranchPrices(currentExtraBranchPrices),
        )
        await tx.customerCompany.update({
          where: { id: companyId },
          data: {
            extraBranchPrices: nextExtraBranchPrices,
            subscriptionPrice: roundToTwoDecimals(
              Math.max(0, company.subscriptionPrice + incrementalExtraPrice),
            ),
          },
        })
      }

      return {
        branch: createdBranch,
      }
    })

    return res.status(201).json({
      branch,
      usage: {
        usedBranches: nextUsedBranches,
        branchLimit: company.branchLimit,
        availableBranches: Math.max(0, company.branchLimit - nextUsedBranches),
      },
      extraBranchPrices: nextExtraBranchPrices,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflicto',
        message: 'Ya existe una sucursal con ese nombre.',
      })
    }

    console.error('Error agregando sucursal para compañía:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteUserAccount = async (req: Request, res: Response) => {
  const { userId } = req.params
  if (!userId) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: 'El id del usuario es requerido.',
    })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({
        error: 'No encontrado',
        message: 'El usuario solicitado no existe.',
      })
    }

    if (isSuperAdminRole(user.role.name)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No se puede eliminar una cuenta superadmin.',
      })
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: {
          createdById: user.id,
        },
        data: {
          createdById: null,
        },
      })

      await tx.authSession.deleteMany({
        where: {
          userId: user.id,
        },
      })

      await tx.user.delete({
        where: {
          id: user.id,
        },
      })
    })

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return res.status(409).json({
          error: 'Conflicto',
          message:
            'No se puede eliminar este usuario porque tiene información vinculada.',
        })
      }
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: 'No encontrado',
          message: 'El usuario solicitado no existe.',
        })
      }
    }

    console.error('Error eliminando usuario administrador:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
