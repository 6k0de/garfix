import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { typeClientSchema, updateTypeClientSchema } from './type-client.schema.js'

export const createTypeClient = async (req: Request, res: Response) => {
  const parsed = typeClientSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, description } = parsed.data

  try {
    const typeClient = await prisma.typeClient.create({
      data: {
        name,
        description: description ?? null,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(typeClient)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un tipo de cliente con ese nombre.',
          meta: err.meta,
        })
      }
    }

    console.error('Error creando tipo de cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllTypeClients = async (_: Request, res: Response) => {
  try {
    const typeClients = await prisma.typeClient.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            clients: true,
          },
        },
      },
    })

    const result = typeClients.map((typeClient) => ({
      id: typeClient.id,
      name: typeClient.name,
      description: typeClient.description ?? '',
      usedIn: typeClient._count.clients ?? 0,
    }))

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error obteniendo tipos de cliente:', error)
    return res.status(500).json({
      error: 'Error al obtener tipos de cliente',
      details: error instanceof Error ? error.message : error,
    })
  }
}

export const updateTypeClient = async (req: Request, res: Response) => {
  const parsed = updateTypeClientSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { id, ...data } = parsed.data

  try {
    await prisma.typeClient.update({
      where: { id },
      data,
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un tipo de cliente con ese nombre.',
          meta: err.meta,
        })
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Tipo de cliente no encontrado' })
      }
    }

    console.error('Error actualizando tipo de cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteTypeClient = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id del tipo de cliente es requerido' })
  }

  try {
    await prisma.typeClient.delete({
      where: { id },
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Tipo de cliente no encontrado' })
      }
      if (err.code === 'P2003') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'No se puede eliminar porque el tipo de cliente está en uso.',
        })
      }
    }

    console.error('Error eliminando tipo de cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
