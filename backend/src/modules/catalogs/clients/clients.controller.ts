import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { clientSchema, updateClientSchema } from './client.schema.js'
import { prisma } from '../../../lib/prisma.js'
import { ensureDefaultClientCatalogs } from '../../../lib/defaultCatalogs.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'

const BRANCH_SCOPE_MESSAGE =
  'Solo puedes acceder a información de la sucursal activa.'

const validateClientCatalogsByBranch = async (
  branchId: string,
  typeClientId?: string | null,
  documentTypeId?: string | null,
) => {
  // Tipo de cliente y tipo de documento son opcionales: solo se validan si vienen.
  const [typeClientExists, documentTypeExists] = await Promise.all([
    typeClientId
      ? prisma.typeClient.findFirst({
          where: { id: typeClientId, branchId },
          select: { id: true },
        })
      : Promise.resolve(true),
    documentTypeId
      ? prisma.documentType.findFirst({
          where: { id: documentTypeId, branchId },
          select: { id: true },
        })
      : Promise.resolve(true),
  ])

  if (!typeClientExists || !documentTypeExists) {
    return {
      valid: false,
      message:
        'El tipo de cliente o tipo de documento no pertenece a la sucursal seleccionada.',
    }
  }

  return {
    valid: true,
    message: null,
  }
}

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
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para crear clientes.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: BRANCH_SCOPE_MESSAGE,
      })
    }

    if (scope.branchId && branchId !== scope.branchId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: BRANCH_SCOPE_MESSAGE,
      })
    }

    const ownedBranch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        companyId: scope.companyId,
      },
      select: {
        id: true,
      },
    })

    if (!ownedBranch) {
      return res.status(400).json({
        error: 'Relación inválida',
        message: 'La sucursal no pertenece a tu empresa.',
      })
    }

    const catalogValidation = await validateClientCatalogsByBranch(
      branchId,
      typeClientId,
      documentTypeId,
    )
    if (!catalogValidation.valid) {
      return res.status(400).json({
        error: 'Relación inválida',
        message: catalogValidation.message,
      })
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email: email ?? '',
        address: address ?? '',
        typeClientId: typeClientId || null,
        documentTypeId: documentTypeId || null,
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
        })
      }
      if (err.code === 'P2003') {
        return res.status(400).json({
          error: 'Relación inválida',
          message:
            'El tipo de cliente, tipo de documento o sucursal especificados no existen.',
        })
      }
    }

    console.error('Error creando cliente:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getAllClients = async (req: Request, res: Response) => {
  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para consultar clientes.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(200).json([])
    }

    const clients = await prisma.client.findMany({
      where: {
        branch: {
          companyId: scope.companyId,
          ...(scope.branchId ? { id: scope.branchId } : {}),
        },
      },
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
    })
  }
}

export const getClientCatalogs = async (req: Request, res: Response) => {
  try {
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para consultar catálogos.',
      })
    }

    if (!scope.branchId) {
      return res.status(400).json({
        error: 'Sucursal requerida',
        message:
          'Debes seleccionar una sucursal activa para consultar catálogos de clientes.',
      })
    }

    await ensureDefaultClientCatalogs({
      companyId: scope.companyId,
      branchId: scope.branchId,
    })

    const [typeClients, documentTypes, branches] = await Promise.all([
      prisma.typeClient.findMany({
        where: {
          branchId: scope.branchId,
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.documentType.findMany({
        where: {
          branchId: scope.branchId,
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.branch.findMany({
        where: {
          companyId: scope.companyId,
          ...(scope.branchId ? { id: scope.branchId } : {}),
        },
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
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para actualizar clientes.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: BRANCH_SCOPE_MESSAGE,
      })
    }

    const ownedClient = await prisma.client.findFirst({
      where: {
        id,
        branch: {
          companyId: scope.companyId,
          ...(scope.branchId ? { id: scope.branchId } : {}),
        },
      },
      select: {
        id: true,
        branchId: true,
        typeClientId: true,
        documentTypeId: true,
      },
    })

    if (!ownedClient) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    if (typeof data.branchId === 'string') {
      if (scope.branchId && data.branchId !== scope.branchId) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: BRANCH_SCOPE_MESSAGE,
        })
      }

      const ownedBranch = await prisma.branch.findFirst({
        where: {
          id: data.branchId,
          companyId: scope.companyId,
        },
        select: {
          id: true,
        },
      })

      if (!ownedBranch) {
        return res.status(400).json({
          error: 'Relación inválida',
          message: 'La sucursal no pertenece a tu empresa.',
        })
      }
    }

    const targetBranchId =
      typeof data.branchId === 'string' ? data.branchId : ownedClient.branchId
    const targetTypeClientId =
      typeof data.typeClientId === 'string' ? data.typeClientId : ownedClient.typeClientId
    const targetDocumentTypeId =
      typeof data.documentTypeId === 'string'
        ? data.documentTypeId
        : ownedClient.documentTypeId

    const catalogValidation = await validateClientCatalogsByBranch(
      targetBranchId,
      targetTypeClientId,
      targetDocumentTypeId,
    )
    if (!catalogValidation.valid) {
      return res.status(400).json({
        error: 'Relación inválida',
        message: catalogValidation.message,
      })
    }

    // Construimos el update normalizando opcionales: correo/dirección vacíos → '',
    // tipo de cliente/documento vacíos → null.
    const updateData: Prisma.ClientUncheckedUpdateInput = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.branchId !== undefined ? { branchId: data.branchId } : {}),
      ...('email' in data ? { email: data.email || '' } : {}),
      ...('address' in data ? { address: data.address || '' } : {}),
      ...('typeClientId' in data ? { typeClientId: data.typeClientId || null } : {}),
      ...('documentTypeId' in data
        ? { documentTypeId: data.documentTypeId || null }
        : {}),
    }

    await prisma.client.update({
      where: { id },
      data: updateData,
    })

    return res.status(200).json()
  } catch (err) {
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
          message:
            'El tipo de cliente, tipo de documento o sucursal especificados no existen.',
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
    const scope = await resolveCompanyScope(req)
    if (!scope) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para eliminar clientes.',
      })
    }

    if (scope.isTechnician && !scope.branchId) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: BRANCH_SCOPE_MESSAGE,
      })
    }

    const ownedClient = await prisma.client.findFirst({
      where: {
        id,
        branch: {
          companyId: scope.companyId,
          ...(scope.branchId ? { id: scope.branchId } : {}),
        },
      },
      select: {
        id: true,
      },
    })

    if (!ownedClient) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

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
