import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { deviceSchema, updateDeviceSchema } from './device.schema.js'
import { prisma } from '../../../lib/prisma.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'
import { sendError } from '../../../lib/httpErrors.js'

const BRANCH_SCOPE_REQUIRED_MESSAGE =
  'Debes seleccionar una sucursal activa para administrar dispositivos.'

const resolveDeviceScope = async (req: Request, res: Response) => {
  const scope = await resolveCompanyScope(req)
  if (!scope) {
    res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para administrar dispositivos.',
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

export const createDevice = async(req: Request, res: Response) => {
  const device = deviceSchema.safeParse(req.body)
  if (!device.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: device.error.issues })
  }

  const { name, description } = device.data

  try {
    const scope = await resolveDeviceScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const device = await prisma.deviceType.create({
      data: {
        name,
        description: description?.trim() || null,
        branchId: scope.branchId,
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
        })
      }
      // Ej: FK inválida (P2003) si companyId no existe
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La sucursal seleccionada no existe.',
        })
      }
    }

    console.error('Error creando dispositivo:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllDevices = async(req: Request, res: Response) => {
  try{
    const scope = await resolveDeviceScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const devices = await prisma.deviceType.findMany({
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
            services: true
          }
        }
      }
    })
    const result = devices.map((device) => ({
      id: device.id,
      name: device.name,
      description: device.description ?? '',
      devicesCount: device._count?.services ?? 0
    }))

    return res.json(result)
  } catch (error) {
    return sendError(res, error, 'No fue posible obtener los dispositivos.')
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
  if (!id) {
    return res.status(400).json({ error: 'El id del dispositivo es requerido' })
  }

  try {
    const scope = await resolveDeviceScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const ownedDevice = await prisma.deviceType.findFirst({
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

    if (!ownedDevice) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' })
    }

    const updateData: Prisma.DeviceTypeUpdateInput = {}
    if (typeof data.name === 'string') {
      updateData.name = data.name
    }
    if (typeof data.description === 'string') {
      updateData.description = data.description.trim() || null
    }

    await prisma.deviceType.update({
      where: {id},
      data: updateData,
    })

    return res.status(200).json()
  }catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'Ya existe un registro con esos datos únicos.',
        })
      }
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'El Dispositivo especificado no existe.',
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
    const scope = await resolveDeviceScope(req, res)
    if (!scope?.branchId) {
      return
    }

    const ownedDevice = await prisma.deviceType.findFirst({
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

    if (!ownedDevice) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' })
    }

    await prisma.deviceType.delete({
      where: {id}
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Dispositivo no encontrado' })
      }
    }
    console.error('error al eliminar el Dispositivo', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
