import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import { normalizeRoleKey, getAuthContext, isSuperAdminRole, isTechnicianRole } from '../../../lib/auth.js'
import { ensureCompanyRoles, ensureDefaultRoles } from '../../../lib/defaultCatalogs.js'
import { prisma } from '../../../lib/prisma.js'
import { roleSchema, updateRoleSchema } from './role.schema.js'

const TECH_ROLE_FORBIDDEN_MESSAGE =
  'El perfil técnico no tiene permisos para administrar roles.'
const RESERVED_COMPANY_ROLE_MESSAGE =
  'Los nombres de rol Administrador y Superadmin están reservados para el sistema.'

const RESERVED_COMPANY_ROLE_KEYS = new Set([
  'superadmin',
  'super admin',
  'administrador',
  'admin',
  'administrador cliente',
])

const normalizeCompanyId = (value: unknown) => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

const extractCompanyIdFromQuery = (req: Request) => {
  const rawValue = req.query.companyId
  if (Array.isArray(rawValue)) {
    return normalizeCompanyId(rawValue[0])
  }
  return normalizeCompanyId(rawValue)
}

const normalizeRoleCode = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50)

const buildRoleCode = (
  name: string,
  code: string | undefined,
  companyId: string | null,
) => {
  const fromPayload = normalizeRoleCode(code?.trim().toUpperCase() || '')
  const normalizedName = normalizeRoleCode(name)
  const baseCode = fromPayload || normalizedName || 'ROLE'

  if (!companyId) {
    return baseCode
  }

  const companyKey = companyId.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 16)
  return `COMPANY_${companyKey}_${baseCode}`.slice(0, 50)
}

const isReservedCompanyRoleName = (name: string) =>
  RESERVED_COMPANY_ROLE_KEYS.has(normalizeRoleKey(name))

interface RoleCatalogScope {
  companyId: string | null
  isSuperAdmin: boolean
}

const resolveRoleCatalogScope = (
  req: Request,
  res: Response,
): RoleCatalogScope | null => {
  const auth = getAuthContext(req)
  if (!auth) {
    res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para continuar.',
    })
    return null
  }

  if (isTechnicianRole(auth.role.name)) {
    res.status(403).json({
      error: 'Acceso denegado',
      message: TECH_ROLE_FORBIDDEN_MESSAGE,
    })
    return null
  }

  const isSuperAdmin = isSuperAdminRole(auth.role.name)
  if (isSuperAdmin) {
    return {
      companyId: extractCompanyIdFromQuery(req),
      isSuperAdmin,
    }
  }

  if (!auth.company?.id) {
    res.status(400).json({
      error: 'Empresa requerida',
      message: 'No se encontró una empresa asociada al usuario.',
    })
    return null
  }

  return {
    companyId: auth.company.id,
    isSuperAdmin,
  }
}

const findRoleDuplicate = async (
  name: string,
  companyId: string | null,
  excludeId?: string,
) => {
  return prisma.role.findFirst({
    where: {
      companyId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
    },
  })
}

export const createRole = async (req: Request, res: Response) => {
  const scope = resolveRoleCatalogScope(req, res)
  if (!scope) {
    return
  }

  const parsed = roleSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, description, code } = parsed.data
  const normalizedName = name.trim()

  if (scope.companyId && isReservedCompanyRoleName(normalizedName)) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: RESERVED_COMPANY_ROLE_MESSAGE,
    })
  }

  try {
    if (scope.companyId) {
      await ensureCompanyRoles(scope.companyId)
    } else {
      await ensureDefaultRoles()
    }

    if (scope.companyId) {
      const companyExists = await prisma.customerCompany.findUnique({
        where: {
          id: scope.companyId,
        },
        select: {
          id: true,
        },
      })

      if (!companyExists) {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La empresa especificada no existe.',
        })
      }
    }

    const duplicateRole = await findRoleDuplicate(normalizedName, scope.companyId)
    if (duplicateRole) {
      return res.status(409).json({
        error: 'Conflicto',
        message: 'Ya existe un rol con ese nombre dentro del alcance seleccionado.',
      })
    }

    const role = await prisma.role.create({
      data: {
        code: buildRoleCode(normalizedName, code, scope.companyId),
        name: normalizedName,
        description: description?.trim() || null,
        companyId: scope.companyId,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(role)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un registro con esos datos únicos.',
        })
      }
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La empresa especificada no existe.',
        })
      }
    }

    console.error('Error creando rol:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllRoles = async (req: Request, res: Response) => {
  const scope = resolveRoleCatalogScope(req, res)
  if (!scope) {
    return
  }

  try {
    await ensureDefaultRoles()
    if (!scope.isSuperAdmin && scope.companyId) {
      await ensureCompanyRoles(scope.companyId)
    }

    const roles = await prisma.role.findMany({
      where: scope.isSuperAdmin ? undefined : { companyId: scope.companyId },
      orderBy: scope.isSuperAdmin
        ? [{ companyId: 'asc' }, { name: 'asc' }]
        : [{ name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    const result = roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      usersCount: role._count?.users ?? 0,
      scope: role.companyId ? 'company' : 'global',
      company: role.company,
    }))

    return res.json(result)
  } catch (error) {
    console.error('Error obteniendo roles:', error)
    return res.status(500).json({
      error: 'Error al obtener roles',
    })
  }
}

export const updateRole = async (req: Request, res: Response) => {
  const scope = resolveRoleCatalogScope(req, res)
  if (!scope) {
    return
  }

  const parsed = updateRoleSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { id, ...data } = parsed.data

  try {
    const ownedRole = await prisma.role.findFirst({
      where: {
        id,
        ...(scope.isSuperAdmin ? {} : { companyId: scope.companyId }),
      },
      select: {
        id: true,
        name: true,
        code: true,
        companyId: true,
      },
    })

    if (!ownedRole) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    const nextName = typeof data.name === 'string' ? data.name.trim() : ownedRole.name
    if (ownedRole.companyId && isReservedCompanyRoleName(nextName)) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: RESERVED_COMPANY_ROLE_MESSAGE,
      })
    }

    if (typeof data.name === 'string') {
      const duplicateRole = await findRoleDuplicate(nextName, ownedRole.companyId, id)
      if (duplicateRole) {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un rol con ese nombre dentro del alcance seleccionado.',
        })
      }
    }

    const updateData: Prisma.RoleUpdateInput = {}
    if (typeof data.name === 'string') {
      updateData.name = nextName
    }
    if (typeof data.description === 'string') {
      updateData.description = data.description.trim() || null
    }
    if (typeof data.code === 'string') {
      updateData.code = buildRoleCode(nextName, data.code, ownedRole.companyId)
    }

    await prisma.role.update({
      where: { id },
      data: updateData,
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un registro con esos datos únicos.',
        })
      }
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'El rol especificado no existe.',
        })
      }
    }

    console.error('Error actualizando rol:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteRole = async (req: Request, res: Response) => {
  const scope = resolveRoleCatalogScope(req, res)
  if (!scope) {
    return
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id del rol es requerido' })
  }

  try {
    const ownedRole = await prisma.role.findFirst({
      where: {
        id,
        ...(scope.isSuperAdmin ? {} : { companyId: scope.companyId }),
      },
      select: {
        id: true,
      },
    })

    if (!ownedRole) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    await prisma.role.delete({
      where: { id },
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'No puedes eliminar un rol que está asignado a usuarios.',
        })
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Rol no encontrado' })
      }
    }

    console.error('Error eliminando rol:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
