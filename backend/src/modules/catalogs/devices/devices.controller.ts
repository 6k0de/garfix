import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { deviceSchema, updateDeviceSchema } from './device.schema.js'
import { prisma } from '../../../lib/prisma.js'

export const createDevice = async(req: Request, res: Response) => {
  const device = deviceSchema.safeParse(req.body)
  if (!device.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: device.error.issues })
  }

  const { name, description } = device.data

  try {
    const device = await prisma.deviceType.create({
      data: {
        name,
        description
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(device)
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
          message: 'El dispositivo especificado no existe.',
          meta: err.meta,
        })
      }
    }
  }
}

export const getAllDevices = async(_: Request, res: Response) => {
  try{
    const devices = await prisma.deviceType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            services: true
          }
        }
      }
    })
    const result = devices.map((device) => ({
      id: device.id,
      name: device.name,
      description: device.description,
      devicesCount: device._count?.services ?? 0
    }))

    return res.json(result)
  } catch (error){
    console.error('Error obteniendo dispositivos:', error);
    return res.status(500).json({
      error: 'Error al obtener dispositivos',
      details: error instanceof Error ? error.message : error,
    });
  }
}

export const updateDevice = async(req: Request, res: Response) => {
  const uDevice = updateDeviceSchema.safeParse(req.body)
  if(!uDevice.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: uDevice.error.issues })
  }

  const {id, ...data} = uDevice.data

  try {
    await prisma.deviceType.update({
      where: {id},
      data
    })

    return res.status(200).json()
  }catch (err) {
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
          message: 'El Dispositivo especificado no existe.',
          meta: err.meta,
        })
      }
    }
    console.error(err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteDevice = async(req: Request, res: Response) => {
  const {id} = req.params
  if(!id){
    return res.status(400).json({ error: 'El id del dispositivo es requerido' })
  }

  try {
    await prisma.deviceType.delete({
      where: {id}
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Dispositivo no encontrada' })
      }
    }
    console.error('error al eliminar el Dispositivo', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
