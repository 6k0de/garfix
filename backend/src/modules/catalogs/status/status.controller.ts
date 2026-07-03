import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import { ensureDefaultClientCatalogs } from '../../../lib/defaultCatalogs.js'
import { prisma } from '../../../lib/prisma.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'
import { sendError } from '../../../lib/httpErrors.js'
import { statusSchema, updateStatusSchema } from './status.schema.js'

const DEFAULT_STATUS_COLOR_HEX = '#64748B'
const BRANCH_SCOPE_REQUIRED_MESSAGE =
  'Debes seleccionar una sucursal activa para administrar estatus.'

const resolveStatusScope = async (req: Request, res: Response) => {
  const scope = await resolveCompanyScope(req)
  if (!scope) {
    res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para administrar estatus.',
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

  await ensureDefaultClientCatalogs({
    companyId: scope.companyId,
    branchId: scope.branchId,
  })

  return scope
}

export const createStatus = async (req: Request, res: Response) => {
  const scope = await resolveStatusScope(req, res)
  if (!scope?.branchId) {
    return
  }

  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, description, colorHex } = parsed.data

  try {
    const status = await prisma.status.create({
      data: {
        name,
        description: description?.trim() || null,
        colorHex: colorHex ?? DEFAULT_STATUS_COLOR_HEX,
        branchId: scope.branchId,
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
          message: 'Ya existe un estatus con ese nombre en la sucursal activa.',
        })
      }
    }

    console.error('Error creando estatus:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllStatus = async (req: Request, res: Response) => {
  const scope = await resolveStatusScope(req, res)
  if (!scope?.branchId) {
    return
  }

  try {
    const statuses = await prisma.status.findMany({
      where: {
        branchId: scope.branchId,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        colorHex: true,
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
      colorHex: status.colorHex ?? DEFAULT_STATUS_COLOR_HEX,
      usedIn: (status._count.histories ?? 0) + (status._count.servicesRequests ?? 0),
    }))

    return res.status(200).json(result)
  } catch (error) {
    return sendError(res, error, 'No fue posible obtener los estatus.')
  }
}

export const updateStatus = async (req: Request, res: Response) => {
  const scope = await resolveStatusScope(req, res)
  if (!scope?.branchId) {
    return
  }

  const parsed = updateStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { id, ...data } = parsed.data

  try {
    const ownedStatus = await prisma.status.findFirst({
      where: {
        id,
        branchId: scope.branchId,
      },
      select: {
        id: true,
      },
    })

    if (!ownedStatus) {
      return res.status(404).json({ error: 'Estatus no encontrado' })
    }

    const updateData: {
      name?: string
      description?: string | null
      colorHex?: string
    } = {}

    if (typeof data.name === 'string') {
      updateData.name = data.name
    }

    if (typeof data.description === 'string') {
      updateData.description = data.description.trim() || null
    }

    if (typeof data.colorHex === 'string') {
      updateData.colorHex = data.colorHex
    }

    await prisma.status.update({
      where: { id },
      data: updateData,
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un estatus con ese nombre en la sucursal activa.',
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
  const scope = await resolveStatusScope(req, res)
  if (!scope?.branchId) {
    return
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id del estatus es requerido' })
  }

  try {
    const ownedStatus = await prisma.status.findFirst({
      where: {
        id,
        branchId: scope.branchId,
      },
      select: {
        id: true,
      },
    })

    if (!ownedStatus) {
      return res.status(404).json({ error: 'Estatus no encontrado' })
    }

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
