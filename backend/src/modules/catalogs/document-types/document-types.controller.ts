import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import {
  documentTypeSchema,
  updateDocumentTypeSchema,
} from './document-type.schema.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'
import { sendError } from '../../../lib/httpErrors.js'

const BRANCH_SCOPE_REQUIRED_MESSAGE =
  'Debes seleccionar una sucursal activa para administrar tipos de documento.'

const resolveDocumentTypeScope = async (req: Request, res: Response) => {
  const scope = await resolveCompanyScope(req)
  if (!scope) {
    res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para administrar tipos de documento.',
    })
    return null
  }

  if (!scope.branchId) {
    res.status(400).json({
      error: 'Sucursal requerida',
      message: BRANCH_SCOPE_REQUIRED_MESSAGE,
    })
    return null
  }

  const ownedBranch = await prisma.branch.findFirst({
    where: {
      id: scope.branchId,
      companyId: scope.companyId,
    },
    select: {
      id: true,
    },
  })

  if (!ownedBranch) {
    res.status(403).json({
      error: 'Acceso denegado',
      message: 'La sucursal activa no pertenece a tu empresa.',
    })
    return null
  }

  return scope
}

export const createDocumentType = async (req: Request, res: Response) => {
  const parsed = documentTypeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, description } = parsed.data

  try {
    const scope = await resolveDocumentTypeScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const documentType = await prisma.documentType.create({
      data: {
        name,
        description: description?.trim() || null,
        branchId: scope.branchId,
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
        })
      }
    }

    console.error('Error creando tipo de documento:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllDocumentTypes = async (req: Request, res: Response) => {
  try {
    const scope = await resolveDocumentTypeScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const documentTypes = await prisma.documentType.findMany({
      where: {
        branchId: scope.branchId,
        branch: {
          companyId: scope.companyId,
        },
      },
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
    return sendError(res, error, 'No fue posible obtener los tipos de documento.')
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

  if (!id) {
    return res.status(400).json({ error: 'El id del tipo de documento es requerido' })
  }

  try {
    const scope = await resolveDocumentTypeScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const ownedDocumentType = await prisma.documentType.findFirst({
      where: {
        id,
        branchId: scope.branchId,
        branch: {
          companyId: scope.companyId,
        },
      },
      select: {
        id: true,
      },
    })

    if (!ownedDocumentType) {
      return res.status(404).json({ error: 'Tipo de documento no encontrado' })
    }

    const updateData: Prisma.DocumentTypeUpdateInput = {}
    if (typeof data.name === 'string') {
      updateData.name = data.name
    }
    if (typeof data.description === 'string') {
      updateData.description = data.description.trim() || null
    }

    await prisma.documentType.update({
      where: { id },
      data: updateData,
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un tipo de documento con ese nombre.',
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
    const scope = await resolveDocumentTypeScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const ownedDocumentType = await prisma.documentType.findFirst({
      where: {
        id,
        branchId: scope.branchId,
        branch: {
          companyId: scope.companyId,
        },
      },
      select: {
        id: true,
      },
    })

    if (!ownedDocumentType) {
      return res.status(404).json({ error: 'Tipo de documento no encontrado' })
    }

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
