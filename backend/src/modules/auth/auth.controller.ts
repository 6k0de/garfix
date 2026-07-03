import bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import {
  buildAccessTokenExpiration,
  getAuthContext,
  getAuthTokenHashFromRequest,
  issueAccessToken,
  hashAccessToken,
} from '../../lib/auth.js'
import { ensureCompanyRoles, ensureDefaultRoles } from '../../lib/defaultCatalogs.js'
import { prisma } from '../../lib/prisma.js'
import { loginSchema, signupSchema, type SignupInput } from './auth.schema.js'
import {
  clearFailedLogins,
  isLoginLocked,
  logSecurityEvent,
  registerFailedLogin,
} from '../../lib/security.js'

// Hash señuelo (coste 12) usado para comparar en tiempo constante cuando el
// usuario no existe, evitando la enumeración por tiempo de respuesta.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('garfix-timing-guard', 12)

// La librería `bcrypt` de Node verifica `$2a$`/`$2b$`, pero NO `$2x$`/`$2y$`
// (variantes de PHP/crypt_blowfish), aunque son equivalentes. Normalizamos esos
// prefijos a `$2b$` antes de comparar para que las contraseñas existentes funcionen.
const normalizeBcryptHash = (hash: string) =>
  /^\$2[xy]\$/.test(hash) ? `$2b$${hash.slice(4)}` : hash

export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, normalizeBcryptHash(hash))

export const YEARLY_PLAN_DISCOUNT_RATE = 0.1
export const getDiscountedYearlyPrice = (monthlyPrice: number) =>
  Math.round(monthlyPrice * 12 * (1 - YEARLY_PLAN_DISCOUNT_RATE))

export const PUBLIC_SIGNUP_PLAN_CONFIG = {
  BASIC: {
    id: 'BASIC',
    monthlyPrice: 259,
    yearlyPrice: getDiscountedYearlyPrice(259),
    includedBranches: 1,
  },
  PRO: {
    id: 'PRO',
    monthlyPrice: 500,
    yearlyPrice: getDiscountedYearlyPrice(500),
    includedBranches: 3,
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    monthlyPrice: 1500,
    yearlyPrice: getDiscountedYearlyPrice(1500),
    includedBranches: 10,
  },
} as const

export type PublicSignupPlan = (typeof PUBLIC_SIGNUP_PLAN_CONFIG)[keyof typeof PUBLIC_SIGNUP_PLAN_CONFIG]

export const resolveSignupPlan = (planCode: string | null | undefined): PublicSignupPlan => {
  const normalizedCode = (planCode ?? '').trim().toUpperCase() as keyof typeof PUBLIC_SIGNUP_PLAN_CONFIG
  return PUBLIC_SIGNUP_PLAN_CONFIG[normalizedCode] ?? PUBLIC_SIGNUP_PLAN_CONFIG.BASIC
}

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  branchId: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
  company: {
    select: {
      id: true,
      name: true,
      status: true,
      subscriptionPlan: true,
      branchLimit: true,
    },
  },
} satisfies Prisma.UserSelect

const buildAuthProfile = (
  user: {
    id: string
    name: string
    email: string | null
    username: string | null
    branchId: string | null
    role: {
      id: string
      name: string
    }
    company: {
      id: string
      name: string
      status: string
      subscriptionPlan: string
      branchLimit: number
    } | null
  },
) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  branchId: user.branchId,
  role: user.role,
  company: user.company,
})

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

export const createSessionPayload = async (userId: string, req: Request) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isActive: true,
    },
    select: authUserSelect,
  })

  if (!user) {
    throw new Error('No fue posible resolver el usuario para la sesión.')
  }

  const token = issueAccessToken()
  const tokenHash = hashAccessToken(token)
  const expiresAt = buildAccessTokenExpiration()

  await prisma.authSession.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    },
  })

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    user: buildAuthProfile(user),
  }
}

export const createPublicSignupAccount = async ({
  payload,
  passwordHash,
  status = 'trial',
}: {
  payload: SignupInput
  passwordHash: string
  status?: 'trial' | 'active'
}) => {
  const role = await resolveAdminRole()
  const selectedPlan = resolveSignupPlan(payload.subscriptionPlan)
  const normalizedEmail = payload.email.trim().toLowerCase()
  const normalizedUsername = payload.username?.trim().toLowerCase() || null
  const initialBranchName = payload.initialBranchName?.trim() || 'Sucursal principal'
  const initialBranchAddress =
    payload.initialBranchAddress?.trim() || 'Dirección pendiente'

  const created = await prisma.$transaction(async (tx) => {
    const company = await tx.customerCompany.create({
      data: {
        name: payload.companyName.trim(),
        email: normalizedEmail,
        status,
        subscriptionPlan: selectedPlan.id,
        subscriptionPrice: selectedPlan.monthlyPrice,
        extraBranchPrices: [],
        branchLimit: selectedPlan.includedBranches,
      },
      select: {
        id: true,
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
      },
      select: {
        id: true,
      },
    })

    await tx.branch.create({
      data: {
        name: initialBranchName,
        address: initialBranchAddress,
        companyId: company.id,
      },
    })

    return {
      companyId: company.id,
      userId: adminUser.id,
    }
  })

  await ensureCompanyRoles(created.companyId).catch((error) => {
    console.error(
      'No fue posible preparar los roles base de la nueva empresa pública:',
      error,
    )
  })

  return created
}

export const signup = async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos inválidos', details: parsed.error.issues })
  }

  try {
    const payload = parsed.data
    const passwordHash = await bcrypt.hash(payload.password, 12)
    const created = await createPublicSignupAccount({
      payload,
      passwordHash,
      status: 'trial',
    })

    const sessionPayload = await createSessionPayload(created.userId, req)
    return res.status(201).json(sessionPayload)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'El correo o usuario ya están registrados.',
        })
      }
    }

    console.error('Error creando cuenta pública:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos inválidos', details: parsed.error.issues })
  }

  const { identifier, password } = parsed.data
  const normalizedIdentifier = identifier.trim().toLowerCase()
  const lockKey = `${normalizedIdentifier}|${req.ip ?? 'unknown'}`

  if (isLoginLocked(lockKey)) {
    logSecurityEvent('login.locked', { identifier: normalizedIdentifier, ip: req.ip })
    return res.status(429).json({
      error: 'Demasiados intentos',
      message: 'Cuenta bloqueada temporalmente por intentos fallidos. Espera unos minutos.',
    })
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          {
            email: {
              equals: normalizedIdentifier,
            },
          },
          {
            username: {
              equals: normalizedIdentifier,
            },
          },
        ],
      },
      select: {
        ...authUserSelect,
        password: true,
      },
    })

    if (!user || !user.password) {
      // Comparación señuelo para igualar el tiempo de respuesta y evitar la
      // enumeración de usuarios por canal lateral de tiempo.
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH)
      registerFailedLogin(lockKey)
      logSecurityEvent('login.failed', { identifier: normalizedIdentifier, ip: req.ip, reason: 'no_user' })
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos.',
      })
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      registerFailedLogin(lockKey)
      logSecurityEvent('login.failed', { identifier: normalizedIdentifier, ip: req.ip, reason: 'bad_password' })
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos.',
      })
    }

    clearFailedLogins(lockKey)
    const sessionPayload = await createSessionPayload(user.id, req)
    return res.status(200).json(sessionPayload)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'No fue posible crear la sesión.',
        })
      }
    }

    console.error('Error iniciando sesión:', error)
    console.error('Mensaje Prisma:', error?.message)

    return res.status(500).json({
      error: {
        name: error?.name,
        message: error?.message,
        clientVersion: error?.clientVersion,
      },
    })
  }
}

export const me = async (req: Request, res: Response) => {
  const auth = getAuthContext(req)
  if (!auth) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para continuar.',
    })
  }

  return res.status(200).json({
    user: {
      id: auth.userId,
      name: auth.name,
      email: auth.email,
      username: auth.username,
      branchId: auth.branchId,
      role: {
        id: auth.role.id,
        name: auth.role.name,
      },
      company: auth.company,
    },
  })
}

export const logout = async (req: Request, res: Response) => {
  const tokenHash = getAuthTokenHashFromRequest(req)
  if (!tokenHash) {
    return res.status(204).json()
  }

  try {
    await prisma.authSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })

    return res.status(204).json()
  } catch (error) {
    console.error('Error cerrando sesión:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
    })
  }
}
