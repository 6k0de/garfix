import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { roleSchema, updateRoleSchema } from './role.schema.js'
import { prisma } from '../../../lib/prisma.js'
import { ensureDefaultRoles } from '../../../lib/defaultCatalogs.js'

export const createRole = async (req: Request, res: Response) => {
  const role = roleSchema.safeParse(req.body)
  if (!role.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: role.error.issues })
  }

  const { name, description } = role.data
  console.log(role)

  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(role)
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
          message: 'El rol especificado no existe.',
          meta: err.meta,
        })
      }
    }

    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllRoles = async (_: Request, res: Response) => {
  try {
    await ensureDefaultRoles()

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    const result = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      usersCount: role._count?.users ?? 0,
    }))

    return res.json(result)
  } catch (error) {
    console.error('Error obteniendo roles:', error)
    return res.status(500).json({
      error: 'Error al obtener roles',
      details: error instanceof Error ? error.message : error,
    })
  }
}

export const updateRole = async (req: Request, res: Response) => {
  const uRole = updateRoleSchema.safeParse(req.body)
  if (!uRole.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: uRole.error.issues })
  }

  const { id, ...data } = uRole.data

  try {
    await prisma.role.update({
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
          message: 'El rol especificada no existe.',
          meta: err.meta,
        })
      }
    }

    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteRole = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id del rol es requerido' })
  }

  try {
    await prisma.role.delete({
      where: { id },
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Rol no encontrada' })
      }
    }
    console.error('error al eliminar el rol', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
