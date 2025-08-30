import { Request, Response } from 'express'
import { Prisma, PrismaClient } from '../../../../generated/prisma'
import { technicSchema, updateTechnicScehma } from './technic.schema'

const prisma = new PrismaClient()

export const createTechnics = async (req: Request, res: Response) => {
  const persed = technicSchema.safeParse(req.body)
  if (!persed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: persed.error.issues })
  }
  const companyIdExample = 'f3507588-2ae7-4bf4-81e5-c882bd632593'
  const { name, email, branchId, roleId } = persed.data
  console.log(persed)

  const [roleExists, branchExists] = await Promise.all([
    prisma.role.findUnique({ where: { id: roleId }, select: { id: true } }),
    branchId
      ? prisma.branch.findUnique({
          where: { id: branchId },
          select: { id: true },
        })
      : Promise.resolve({ id: null }),
  ])

  if (!roleExists) {
    return res.status(400).json({
      error: 'Relación inválida',
      message: 'El rol especificado no existe.',
    })
  }
  if (branchId && !branchExists?.id) {
    return res.status(400).json({
      error: 'Relación inválida',
      message: 'La sucursal especificada no existe.',
    })
  }

  try {
    const technic = await prisma.user.create({
      data: {
        name,
        email,
        branchId,
        roleId,
        companyId: companyIdExample,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(technic)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // UNIQUE constraint (email)
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un usuario con ese correo electrónico.',
          meta: err.meta,
        })
      }
      // FOREIGN KEY constraint
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'El rol o la sucursal especificados no existen.',
          meta: err.meta,
        })
      }
    }

    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllTechnicians = async(_:Request, res: Response) => {
  try{
    const technicians = await prisma.user.findMany({
      where: {
        role: {name: 'Técnico'}
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: {select: {id: true, name: true}},
        branch: {select: {id: true, name: true}},
        services: {
          where: {
            serviceRequest: {
              status: {
                name: {in: ['En proceso', 'Activo', 'En taller']},
              },
            },
          },
        },
      },
    })

    const result = technicians.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      role: t.role,
      branch: t.branch,
      serviceCount: t.services.length ?? 0
    }))

    return res.json(result)
  }catch (error) {
    console.error('Error obteniendo técnicos:', error);
    return res.status(500).json({
      error: 'Error al obtener técnicos',
      details: error instanceof Error ? error.message : error,
    });
  }
}

export const updateTechnician = async(req: Request, res: Response) => {
  const uTechnic = updateTechnicScehma.safeParse(req.body)
  if(!uTechnic.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: uTechnic.error.issues })
  }

  const {id, ...data} = uTechnic.data

  try {
    await prisma.user.update({
      where: {id},
      data: {
        name: data.name,
        email: data.email,
        branchId: data.branchId,
        roleId: data.roleId
      }
    })

    return res.status(200).json()
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Técnico no encontrado' });
      }
    }
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteTechnician = async(req: Request, res: Response) => {
  const { id } = req.params
  if(!id){
    return res.status(400).json({ error: 'El id del tecnico es requerido' })
  }

  try {
    await prisma.user.delete({
      where: {id},
    })

    return res.status(200).json()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Rol no encontrada' })
      }
    }
    console.error('error al eliminar el rol', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
