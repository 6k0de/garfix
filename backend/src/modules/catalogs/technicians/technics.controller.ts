import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import { technicSchema, updateTechnicScehma } from './technic.schema.js'
import { ensureCompanyRoles } from '../../../lib/defaultCatalogs.js'
import { prisma } from '../../../lib/prisma.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'
import { normalizeRoleKey } from '../../../lib/auth.js'

const TECH_TECHNICIAN_FORBIDDEN_MESSAGE =
  'El perfil técnico no tiene permisos para administrar técnicos.'
const BRANCH_SCOPE_MESSAGE =
  'Solo puedes acceder a información de la sucursal activa.'
const TECH_ROLE_REQUIRED_MESSAGE =
  'El rol seleccionado no corresponde al perfil técnico.'
const TECH_ROLE_COMPANY_MESSAGE =
  'El rol seleccionado no pertenece a tu empresa.'
const TECH_CREDENTIALS_REQUIRED_MESSAGE =
  'Para asignar una contraseña, el técnico debe tener correo o nombre de usuario.'

const TECH_ROLE_KEYS = new Set(['tecnico', 'tech'])

const isTechnicianCatalogRole = (roleName: string | null | undefined) =>
  TECH_ROLE_KEYS.has(normalizeRoleKey(roleName))

// El conflicto de unicidad puede venir del correo o del nombre de usuario. El campo
// en conflicto puede aparecer en meta.target o anidado en el error del driver (pg),
// así que buscamos "username" en todo el meta serializado.
const uniqueConflictMessage = (error: Prisma.PrismaClientKnownRequestError) => {
  const haystack = JSON.stringify(error.meta ?? '').toLowerCase()
  return haystack.includes('username')
    ? 'Ya existe un usuario con ese nombre de usuario.'
    : 'Ya existe un usuario con ese correo electrónico.'
}

export const createTechnics = async (req: Request, res: Response) => {
  const persed = technicSchema.safeParse(req.body)
  if (!persed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: persed.error.issues })
  }
  const { name, email, username, branchId, roleId, password } = persed.data
  const normalizedEmail = email?.trim().toLowerCase() || null
  const normalizedUsername = username?.trim().toLowerCase() || null

  const scope = await resolveCompanyScope(req)
  if (!scope) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para crear técnicos.',
    })
  }

  if (scope.isTechnician) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: TECH_TECHNICIAN_FORBIDDEN_MESSAGE,
    })
  }

  if (scope.branchId && branchId !== scope.branchId) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: BRANCH_SCOPE_MESSAGE,
    })
  }

  await ensureCompanyRoles(scope.companyId)

  const [roleExists, branchExists] = await Promise.all([
    prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, companyId: true },
    }),
    prisma.branch.findFirst({
      where: {
        id: branchId,
        companyId: scope.companyId,
      },
      select: { id: true, companyId: true },
    }),
  ])

  if (!roleExists) {
    return res.status(400).json({
      error: 'Relación inválida',
      message: 'El rol especificado no existe.',
    })
  }
  if (!isTechnicianCatalogRole(roleExists.name)) {
    return res.status(400).json({
      error: 'Relación inválida',
      message: TECH_ROLE_REQUIRED_MESSAGE,
    })
  }
  if (roleExists.companyId !== scope.companyId) {
    return res.status(400).json({
      error: 'Relación inválida',
      message: TECH_ROLE_COMPANY_MESSAGE,
    })
  }
  if (!branchExists?.id) {
    return res.status(400).json({
      error: 'Relación inválida',
      message: 'La sucursal especificada no existe o no pertenece a tu empresa.',
    })
  }

  const companyId = scope.companyId

  try {
    const passwordHash = password ? await bcrypt.hash(password, 12) : null

    const technic = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        username: normalizedUsername,
        password: passwordHash,
        branchId,
        roleId,
        companyId,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(technic)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // UNIQUE constraint (correo o nombre de usuario)
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: uniqueConflictMessage(err),
        })
      }
      // FOREIGN KEY constraint
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'El rol o la sucursal especificados no existen.',
        })
      }
    }

    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllTechnicians = async(req:Request, res: Response) => {
  try{
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para consultar técnicos.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.json([])
    }

    await ensureCompanyRoles(scope.companyId)

    const technicians = await prisma.user.findMany({
      where: {
        companyId: scope.companyId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
        role: {
          name: {
            in: ['Técnico', 'Tecnico', 'Tech'],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        password: true,
        role: {select: {id: true, name: true}},
        branch: {select: {id: true, name: true}},
        services: {
          where: {
            serviceRequest: {
              status: {
                name: {in: ['En proceso', 'Activo', 'En taller']},
              },
            },
          },
        },
      },
    })

    const result = technicians.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      username: t.username,
      role: t.role,
      branch: t.branch,
      hasCredentials: Boolean(t.password),
      serviceCount: t.services.length ?? 0
    }))

    return res.json(result)
  }catch (error) {
    console.error('Error obteniendo técnicos:', error);
    return res.status(500).json({
      error: 'Error al obtener técnicos',
    });
  }
}

export const updateTechnician = async(req: Request, res: Response) => {
  const uTechnic = updateTechnicScehma.safeParse(req.body)
  if(!uTechnic.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: uTechnic.error.issues })
  }

  const {id, ...data} = uTechnic.data

  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para actualizar técnicos.',
      })
    }

    if (scope.isTechnician) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: TECH_TECHNICIAN_FORBIDDEN_MESSAGE,
      })
    }

    await ensureCompanyRoles(scope.companyId)

    const ownedTechnician = await prisma.user.findFirst({
      where: {
        id,
        companyId: scope.companyId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
      },
      select: {
        id: true,
        email: true,
        username: true,
        roleId: true,
      },
    })

    if (!ownedTechnician) {
      return res.status(404).json({ error: 'Técnico no encontrado' })
    }

    if (typeof data.branchId === 'string') {
      if (scope.branchId && data.branchId !== scope.branchId) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: BRANCH_SCOPE_MESSAGE,
        })
      }

      const ownedBranch = await prisma.branch.findFirst({
        where: {
          id: data.branchId,
          companyId: scope.companyId,
        },
        select: {
          id: true,
        },
      })

      if (!ownedBranch) {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La sucursal especificada no existe o no pertenece a tu empresa.',
        })
      }
    }

    if (typeof data.roleId === 'string') {
      const roleExists = await prisma.role.findUnique({
        where: {
          id: data.roleId,
        },
        select: {
          id: true,
          name: true,
          companyId: true,
        },
      })

      if (!roleExists) {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'El rol especificado no existe.',
        })
      }

      if (!isTechnicianCatalogRole(roleExists.name)) {
        return res.status(400).json({
          error: 'Relación inválida',
          message: TECH_ROLE_REQUIRED_MESSAGE,
        })
      }

      if (roleExists.companyId !== scope.companyId) {
        return res.status(400).json({
          error: 'Relación inválida',
          message: TECH_ROLE_COMPANY_MESSAGE,
        })
      }
    } else {
      const currentRole = await prisma.role.findUnique({
        where: {
          id: ownedTechnician.roleId,
        },
        select: {
          id: true,
          name: true,
          companyId: true,
        },
      })

      if (
        !currentRole ||
        !isTechnicianCatalogRole(currentRole.name) ||
        currentRole.companyId !== scope.companyId
      ) {
        return res.status(400).json({
          error: 'Relación inválida',
          message: TECH_ROLE_REQUIRED_MESSAGE,
        })
      }
    }

    const nextEmail =
      typeof data.email === 'string'
        ? data.email.trim().toLowerCase()
        : ownedTechnician.email?.trim().toLowerCase() || ''
    const nextUsername =
      typeof data.username === 'string'
        ? data.username.trim().toLowerCase()
        : ownedTechnician.username?.trim().toLowerCase() || ''

    if (data.password && nextEmail.length === 0 && nextUsername.length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: TECH_CREDENTIALS_REQUIRED_MESSAGE,
      })
    }

    const updateData: Prisma.UserUncheckedUpdateInput = {}
    if (typeof data.name === 'string') {
      updateData.name = data.name
    }
    if (typeof data.email === 'string') {
      updateData.email = nextEmail
    }
    if (typeof data.username === 'string') {
      updateData.username = nextUsername
    }
    if (typeof data.branchId === 'string') {
      updateData.branchId = data.branchId
    }
    if (typeof data.roleId === 'string') {
      updateData.roleId = data.roleId
    }
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12)
    }

    await prisma.user.update({
      where: {id},
      data: updateData,
    })

    return res.status(200).json()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Técnico no encontrado' })
      }
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: uniqueConflictMessage(error),
        })
      }
    }
    console.error(error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteTechnician = async(req: Request, res: Response) => {
  const { id } = req.params
  if(!id){
    return res.status(400).json({ error: 'El id del tecnico es requerido' })
  }

  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para eliminar técnicos.',
      })
    }

    if (scope.isTechnician) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: TECH_TECHNICIAN_FORBIDDEN_MESSAGE,
      })
    }

    const ownedTechnician = await prisma.user.findFirst({
      where: {
        id,
        companyId: scope.companyId,
        ...(scope.branchId ? { branchId: scope.branchId } : {}),
      },
      select: {
        id: true,
      },
    })

    if (!ownedTechnician) {
      return res.status(404).json({ error: 'Técnico no encontrado' })
    }

    await prisma.user.delete({
      where: {id},
    })

    return res.status(200).json()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Técnico no encontrado' })
      }
    }
    console.error('Error al eliminar técnico', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
