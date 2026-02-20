import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { locationSchema, updateLocationSchema } from './location.schema.js'
import { prisma } from '../../../lib/prisma.js'

export const createLocation = async (req: Request, res: Response) => {
  const parsed = locationSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, branchId, instructions } = parsed.data

  try {
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
          meta: err.meta,
        })
      }
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La sucursal especificada no existe.',
          meta: err.meta,
        })
      }
    }

    console.error('Error creando ubicación:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllLocations = async (_: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
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
    console.error('Error obteniendo ubicaciones:', error)
    return res.status(500).json({
      error: 'Error al obtener ubicaciones',
      details: error instanceof Error ? error.message : error,
    })
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
          meta: err.meta,
        })
      }
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La sucursal especificada no existe.',
          meta: err.meta,
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
