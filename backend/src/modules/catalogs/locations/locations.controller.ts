import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { locationSchema, updateLocationSchema } from './location.schema.js'
import { prisma } from '../../../lib/prisma.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'
import { sendError } from '../../../lib/httpErrors.js'

const BRANCH_SCOPE_MESSAGE =
  'Solo puedes acceder a información de la sucursal activa.'

export const createLocation = async (req: Request, res: Response) => {
  const parsed = locationSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, branchId, instructions } = parsed.data

  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para crear ubicaciones.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: BRANCH_SCOPE_MESSAGE,
      })
    }

    if (scope.branchId && branchId !== scope.branchId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: BRANCH_SCOPE_MESSAGE,
      })
    }

    const ownedBranch = await prisma.branch.findFirst({
      where: {
        id: branchId,
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

    const location = await prisma.location.create({
      data: {
        name,
        branchId,
        intructions: instructions ?? null,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(location)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe una ubicación con ese nombre.',
        })
      }
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La sucursal especificada no existe.',
        })
      }
    }

    console.error('Error creando ubicación:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllLocations = async (req: Request, res: Response) => {
  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para consultar ubicaciones.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(200).json([])
    }

    const locations = await prisma.location.findMany({
      where: {
        branch: {
          companyId: scope.companyId,
          ...(scope.branchId ? { id: scope.branchId } : {}),
        },
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        intructions: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
    })

    const result = locations.map((location) => ({
      id: location.id,
      name: location.name,
      instructions: location.intructions ?? '',
      branchId: location.branchId,
      branch: location.branch,
      servicesCount: location._count.services ?? 0,
    }))

    return res.status(200).json(result)
  } catch (error) {
    return sendError(res, error, 'No fue posible obtener las ubicaciones.')
  }
}

export const updateLocation = async (req: Request, res: Response) => {
  const parsed = updateLocationSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { id, instructions, ...rest } = parsed.data
  const data = {
    ...rest,
    ...(instructions !== undefined ? { intructions: instructions } : {}),
  }

  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para actualizar ubicaciones.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: BRANCH_SCOPE_MESSAGE,
      })
    }

    const ownedLocation = await prisma.location.findFirst({
      where: {
        id,
        branch: {
          companyId: scope.companyId,
          ...(scope.branchId ? { id: scope.branchId } : {}),
        },
      },
      select: {
        id: true,
      },
    })

    if (!ownedLocation) {
      return res.status(404).json({ error: 'Ubicación no encontrada' })
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

    await prisma.location.update({
      where: { id },
      data,
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe una ubicación con ese nombre.',
        })
      }
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La sucursal especificada no existe.',
        })
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Ubicación no encontrada' })
      }
    }

    console.error('Error actualizando ubicación:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteLocation = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id de la ubicación es requerido' })
  }

  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para eliminar ubicaciones.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: BRANCH_SCOPE_MESSAGE,
      })
    }

    const ownedLocation = await prisma.location.findFirst({
      where: {
        id,
        branch: {
          companyId: scope.companyId,
          ...(scope.branchId ? { id: scope.branchId } : {}),
        },
      },
      select: {
        id: true,
      },
    })

    if (!ownedLocation) {
      return res.status(404).json({ error: 'Ubicación no encontrada' })
    }

    await prisma.location.delete({
      where: { id },
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Ubicación no encontrada' })
      }
      if (err.code === 'P2003') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'No se puede eliminar porque la ubicación está en uso.',
        })
      }
    }

    console.error('Error eliminando ubicación:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
