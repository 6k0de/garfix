import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { clientSchema, updateClientSchema } from './client.schema.js'
import { prisma } from '../../../lib/prisma.js'
import { ensureDefaultClientCatalogs } from '../../../lib/defaultCatalogs.js'

export const createClient = async (req: Request, res: Response) => {
  const parsed = clientSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { name, phone, email, address, typeClientId, documentTypeId, branchId } =
    parsed.data

  try {
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email,
        address,
        typeClientId,
        documentTypeId,
        branchId,
      },
      select: {
        id: true,
      },
    })

    return res.status(201).json(client)
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
          message:
            'El tipo de cliente, tipo de documento o sucursal especificados no existen.',
          meta: err.meta,
        })
      }
    }

    console.error('Error creando cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllClients = async (_: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        typeClientId: true,
        documentTypeId: true,
        branchId: true,
        typeClient: {
          select: {
            id: true,
            name: true,
          },
        },
        documentType: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            serviceRequests: true,
          },
        },
      },
    })

    const result = clients.map((client) => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      typeClientId: client.typeClientId,
      documentTypeId: client.documentTypeId,
      branchId: client.branchId,
      typeClient: client.typeClient,
      documentType: client.documentType,
      branch: client.branch,
      servicesCount: client._count.serviceRequests ?? 0,
    }))

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error obteniendo clientes:', error)
    return res.status(500).json({
      error: 'Error al obtener clientes',
      details: error instanceof Error ? error.message : error,
    })
  }
}

export const getClientCatalogs = async (_: Request, res: Response) => {
  try {
    await ensureDefaultClientCatalogs()

    const [typeClients, documentTypes, branches] = await Promise.all([
      prisma.typeClient.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.documentType.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.branch.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ])

    return res.status(200).json({
      typeClients,
      documentTypes,
      branches,
    })
  } catch (error) {
    console.error('Error obteniendo catálogos para clientes:', error)
    return res.status(500).json({
      error: 'Error al obtener catálogos',
      details: error instanceof Error ? error.message : error,
    })
  }
}

export const updateClient = async (req: Request, res: Response) => {
  const parsed = updateClientSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos invalidos', details: parsed.error.issues })
  }

  const { id, ...data } = parsed.data

  try {
    await prisma.client.update({
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
          message:
            'El tipo de cliente, tipo de documento o sucursal especificados no existen.',
          meta: err.meta,
        })
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Cliente no encontrado' })
      }
    }

    console.error('Error actualizando cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const deleteClient = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ error: 'El id del cliente es requerido' })
  }

  try {
    await prisma.client.delete({
      where: { id },
    })

    return res.status(200).json()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Cliente no encontrado' })
      }
      if (err.code === 'P2003') {
        return res.status(409).json({
          error: 'Conflicto',
          message: 'No se puede eliminar porque el cliente está en uso.',
        })
      }
    }

    console.error('Error eliminando cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
