import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { typeClientSchema, updateTypeClientSchema } from './type-client.schema.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'
import { sendError } from '../../../lib/httpErrors.js'

const TECH_TYPE_CLIENT_FORBIDDEN_MESSAGE =
  'El perfil técnico no tiene permisos para administrar tipos de cliente.'
const BRANCH_SCOPE_REQUIRED_MESSAGE =
  'Debes seleccionar una sucursal activa para administrar tipos de cliente.'

const resolveTypeClientScope = async (req: Request, res: Response) => {
  const scope = await resolveCompanyScope(req)
  if (!scope) {
    res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para administrar tipos de cliente.',
    })
    return null
  }

  if (scope.isTechnician) {
    res.status(403).json({
      error: 'Acceso denegado',
      message: TECH_TYPE_CLIENT_FORBIDDEN_MESSAGE,
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

export const createTypeClient = async (req: Request, res: Response) => {
  const parsed = typeClientSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, description } = parsed.data

  try {
    const scope = await resolveTypeClientScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const typeClient = await prisma.typeClient.create({
      data: {
        name,
        description: description?.trim() || null,
        branchId: scope.branchId,
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
        })
      }
    }

    console.error('Error creando tipo de cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllTypeClients = async (req: Request, res: Response) => {
  try {
    const scope = await resolveTypeClientScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const typeClients = await prisma.typeClient.findMany({
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

    const result = typeClients.map((typeClient) => ({
      id: typeClient.id,
      name: typeClient.name,
      description: typeClient.description ?? '',
      usedIn: typeClient._count.clients ?? 0,
    }))

    return res.status(200).json(result)
  } catch (error) {
    return sendError(res, error, 'No fue posible obtener los tipos de cliente.')
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

  if (!id) {
    return res.status(400).json({ error: 'El id del tipo de cliente es requerido' })
  }

  try {
    const scope = await resolveTypeClientScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const ownedTypeClient = await prisma.typeClient.findFirst({
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

    if (!ownedTypeClient) {
      return res.status(404).json({ error: 'Tipo de cliente no encontrado' })
    }

    const updateData: Prisma.TypeClientUpdateInput = {}
    if (typeof data.name === 'string') {
      updateData.name = data.name
    }
    if (typeof data.description === 'string') {
      updateData.description = data.description.trim() || null
    }

    await prisma.typeClient.update({
      where: { id },
      data: updateData,
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un tipo de cliente con ese nombre.',
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
    const scope = await resolveTypeClientScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const ownedTypeClient = await prisma.typeClient.findFirst({
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

    if (!ownedTypeClient) {
      return res.status(404).json({ error: 'Tipo de cliente no encontrado' })
    }

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
