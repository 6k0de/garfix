import { Request, Response } from 'express'
import { branchSchema, updateBranchSchema } from './branche.schema.js'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'
import { ensureDefaultBranch, ensureDefaultCompany } from '../../../lib/defaultCatalogs.js'

export const createBranch = async (req: Request, res: Response) => {
  const branch = branchSchema.safeParse(req.body)
  if (!branch.success) {
    return res
      .status(400)
      .json({ error: 'Datos Invalidos', details: branch.error.issues })
  }
  const { name, address } = branch.data
  const company = await ensureDefaultCompany()

  try {
    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        companyId: company.id,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    return res.status(201).json(branch)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // Ejemplo: violación de unique (P2002)
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un registro con esos datos únicos.',
          meta: err.meta,
        })
      }
      // Ej: FK inválida (P2003) si companyId no existe
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La compañía especificada no existe.',
          meta: err.meta,
        })
      }
    }

    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllBranches = async (_: Request, res: Response) => {
  try {
    await ensureDefaultBranch()

    const techRol = await prisma.role.findFirst({
      where: { name: { in: ['Técnico', 'Tecnico'] } },
      select: { id: true },
    })

    const techRolId = techRol?.id ?? null

    const resultBranchs = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        _count: {
          select: {
            clients: true,
          },
        },
        users: techRolId
          ? { where: { roleId: techRolId }, select: { id: true } }
          : false,
      },
    })
    console.log(resultBranchs)
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
    // Devolver array vacío o placeholder
    return []
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
