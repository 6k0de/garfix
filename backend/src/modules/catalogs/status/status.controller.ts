import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { statusSchema, updateStatusSchema } from './status.schema.js'
import { prisma } from '../../../lib/prisma.js'

export const createStatus = async (req: Request, res: Response) => {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, description } = parsed.data

  try {
    const status = await prisma.status.create({
      data: {
        name,
        description: description ?? null,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(status)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un estatus con ese nombre.',
          meta: err.meta,
        })
      }
    }

    console.error('Error creando estatus:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllStatus = async (_: Request, res: Response) => {
  try {
    const statuses = await prisma.status.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            histories: true,
            servicesRequests: true,
          },
        },
      },
    })

    const result = statuses.map((status) => ({
      id: status.id,
      name: status.name,
      description: status.description ?? '',
      usedIn: (status._count.histories ?? 0) + (status._count.servicesRequests ?? 0),
    }))

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error obteniendo estatus:', error)
    return res.status(500).json({
      error: 'Error al obtener estatus',
      details: error instanceof Error ? error.message : error,
    })
  }
}

export const updateStatus = async (req: Request, res: Response) => {
  const parsed = updateStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { id, ...data } = parsed.data

  try {
    await prisma.status.update({
      where: { id },
      data,
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un estatus con ese nombre.',
          meta: err.meta,
        })
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Estatus no encontrado' })
      }
    }

    console.error('Error actualizando estatus:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteStatus = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id del estatus es requerido' })
  }

  try {
    await prisma.status.delete({
      where: { id },
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Estatus no encontrado' })
      }
      if (err.code === 'P2003') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'No se puede eliminar porque el estatus está en uso.',
        })
      }
    }

    console.error('Error eliminando estatus:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
