import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import {
  documentTypeSchema,
  updateDocumentTypeSchema,
} from './document-type.schema.js'

export const createDocumentType = async (req: Request, res: Response) => {
  const parsed = documentTypeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, description } = parsed.data

  try {
    const documentType = await prisma.documentType.create({
      data: {
        name,
        description: description ?? null,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(documentType)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un tipo de documento con ese nombre.',
          meta: err.meta,
        })
      }
    }

    console.error('Error creando tipo de documento:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllDocumentTypes = async (_: Request, res: Response) => {
  try {
    const documentTypes = await prisma.documentType.findMany({
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

    const result = documentTypes.map((documentType) => ({
      id: documentType.id,
      name: documentType.name,
      description: documentType.description ?? '',
      usedIn: documentType._count.clients ?? 0,
    }))

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error obteniendo tipos de documento:', error)
    return res.status(500).json({
      error: 'Error al obtener tipos de documento',
      details: error instanceof Error ? error.message : error,
    })
  }
}

export const updateDocumentType = async (req: Request, res: Response) => {
  const parsed = updateDocumentTypeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { id, ...data } = parsed.data

  try {
    await prisma.documentType.update({
      where: { id },
      data,
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un tipo de documento con ese nombre.',
          meta: err.meta,
        })
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Tipo de documento no encontrado' })
      }
    }

    console.error('Error actualizando tipo de documento:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteDocumentType = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id del tipo de documento es requerido' })
  }

  try {
    await prisma.documentType.delete({
      where: { id },
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Tipo de documento no encontrado' })
      }
      if (err.code === 'P2003') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'No se puede eliminar porque el tipo de documento está en uso.',
        })
      }
    }

    console.error('Error eliminando tipo de documento:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
