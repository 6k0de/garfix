import { Request, Response } from 'express'
import { branchSchema, updateBranchSchema } from './branche.schema.js'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'
import { ensureDefaultClientCatalogs } from '../../../lib/defaultCatalogs.js'

const TECH_BRANCH_FORBIDDEN_MESSAGE =
  'El perfil técnico no tiene permisos para administrar sucursales.'

export const createBranch = async (req: Request, res: Response) => {
  const branch = branchSchema.safeParse(req.body)
  if (!branch.success) {
    return res
      .status(400)
      .json({ error: 'Datos Invalidos', details: branch.error.issues })
  }
  const { name, address } = branch.data

  const scope = await resolveCompanyScope(req)
  if (!scope) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para crear sucursales.',
    })
  }

  if (scope.isTechnician) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: TECH_BRANCH_FORBIDDEN_MESSAGE,
    })
  }

  const { companyId } = scope
  if (!companyId) {
    return res.status(400).json({
      error: 'Empresa no definida',
      message: 'No se encontró una empresa asociada al usuario.',
    })
  }

  const company = await prisma.customerCompany.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      branchLimit: true,
    },
  })

  if (!company) {
    return res.status(400).json({
      error: 'Relación inválida',
      message: 'La compañía especificada no existe.',
    })
  }

  const usedBranches = await prisma.branch.count({
    where: {
      companyId: company.id,
    },
  })

  if (usedBranches >= company.branchLimit) {
    return res.status(409).json({
      error: 'Límite de sucursales alcanzado',
      message: `Tu suscripción permite ${company.branchLimit} sucursal(es). Actualiza tu plan para agregar más.`,
    })
  }

  try {
    const branch = await prisma.branch.create({
      data: {
        name,
        address: address?.trim() || 'Dirección pendiente',
        companyId: companyId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    await ensureDefaultClientCatalogs({
      companyId,
      branchId: branch.id,
    }).catch((error) => {
      console.error(
        'No fue posible preparar catálogos base para la sucursal creada:',
        error,
      )
    })

    return res.status(201).json(branch)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Ejemplo: violación de unique (P2002)
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un registro con esos datos únicos.',
        })
      }
      // Ej: FK inválida (P2003) si companyId no existe
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La compañía especificada no existe.',
        })
      }
    }

    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para consultar sucursales.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(200).json([])
    }

    const resultBranchs = await prisma.branch.findMany({
      where: {
        companyId: scope.companyId,
        ...(scope.isTechnician && scope.branchId ? { id: scope.branchId } : {}),
      },
      select: {
        id: true,
        name: true,
        address: true,
        _count: {
          select: {
            clients: true,
          },
        },
        users: {
          where: {
            role: {
              name: {
                in: ['Técnico', 'Tecnico', 'Tech'],
              },
            },
          },
          select: {
            id: true,
          },
        },
      },
    })
    const data = resultBranchs.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      clientsCount: b._count.clients ?? 0,
      technicCount: Array.isArray(b.users) ? b.users.length : 0,
    }))

    return res.status(200).json(data)
  } catch (error) {
    console.error('Error obteniendo sucursales:', error)
    return res.status(500).json({
      error: 'Error al obtener sucursales',
    })
  }
}

export const updateBranche = async (req: Request, res: Response) => {
  const uBranch = updateBranchSchema.safeParse(req.body)
  if (!uBranch.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: uBranch.error.issues,
    })
  }

  const { id, ...data } = uBranch.data

  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para actualizar sucursales.',
      })
    }

    if (scope.isTechnician) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: TECH_BRANCH_FORBIDDEN_MESSAGE,
      })
    }

    const ownedBranch = await prisma.branch.findFirst({
      where: {
        id,
        companyId: scope.companyId,
      },
      select: {
        id: true,
      },
    })

    if (!ownedBranch) {
      return res.status(404).json({
        error: 'Sucursal no encontrada',
      })
    }

    await prisma.branch.update({
      where: { id },
      data,
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
          message: 'La sucursal especificada no existe.',
        })
      }
    }

    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteBranch = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id de la sucursal es requerido' })
  }

  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para eliminar sucursales.',
      })
    }

    if (scope.isTechnician) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: TECH_BRANCH_FORBIDDEN_MESSAGE,
      })
    }

    const ownedBranch = await prisma.branch.findFirst({
      where: {
        id,
        companyId: scope.companyId,
      },
      select: {
        id: true,
      },
    })

    if (!ownedBranch) {
      return res.status(404).json({ error: 'Sucursal no encontrada' })
    }

    await prisma.branch.delete({
      where: { id },
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Sucursal no encontrada' })
      }
    }
    console.error('error al eliminar la sucursal', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
