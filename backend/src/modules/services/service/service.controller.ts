import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { CreateServicePayloadSchema } from './service.schema.js'
import { prisma } from '../../../lib/prisma.js'
import { ensureDefaultClientCatalogs } from '../../../lib/defaultCatalogs.js'
import { resolveCompanyScope } from '../../../lib/companyScope.js'
import {
    compressAndStoreEvidence,
    deleteStoredEvidenceFile,
    ensureServiceEvidenceFolder,
    EvidenceValidationError,
    MAX_EVIDENCE_FILES_PER_UPLOAD,
} from '../../../lib/evidenceStorage.js'
import {
    clearEvidenceForServiceIfExpired,
    runEvidenceCleanup,
} from '../../../lib/evidenceCleanup.js'

const BRANCH_SCOPE_MESSAGE =
    'Solo puedes acceder y gestionar servicios de la sucursal activa.'

const parseServiceRequestId = (rawId: string) => {
    const parsed = Number(rawId)
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null
    }
    return parsed
}

const parseQrCode = (value: string | undefined) => {
    if (!value) return null
    let next = value
    try {
        next = decodeURIComponent(value)
    } catch {
        // Conserva el valor original cuando no está URL encoded.
    }

    const parsed = next.trim()
    return parsed.length > 0 ? parsed : null
}

const buildPublicFileUrl = (req: Request, filePath: string) => {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath
    }

    const forwardedProtocol = req.header('x-forwarded-proto')?.split(',')[0]?.trim()
    const protocol = forwardedProtocol || req.protocol

    return `${protocol}://${req.get('host')}${filePath}`
}

const toUniqueIds = (values: Array<string | null | undefined>) =>
    Array.from(
        new Set(
            values
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .filter((value) => value.length > 0),
        ),
    )

const validateDeviceRelationsWithinCompany = async (
    companyId: string,
    devices: Array<{
        deviceTypeId: string
        technicianId: string
        locationId: string
    }>,
    branchId: string,
) => {
    const deviceTypeIds = toUniqueIds(devices.map((device) => device.deviceTypeId))
    const technicianIds = toUniqueIds(devices.map((device) => device.technicianId))
    const locationIds = toUniqueIds(devices.map((device) => device.locationId))

    if (deviceTypeIds.length > 0) {
        const deviceTypes = await prisma.deviceType.findMany({
            where: {
                id: {
                    in: deviceTypeIds,
                },
                branchId,
                branch: {
                    companyId,
                },
            },
            select: {
                id: true,
            },
        })

        if (deviceTypes.length !== deviceTypeIds.length) {
            return {
                valid: false,
                message: 'Uno o más tipos de equipo no pertenecen a la sucursal seleccionada.',
            }
        }
    }

    if (technicianIds.length > 0) {
        const technicians = await prisma.user.findMany({
            where: {
                id: {
                    in: technicianIds,
                },
                companyId,
                branchId,
            },
            select: {
                id: true,
            },
        })

        if (technicians.length !== technicianIds.length) {
            return {
                valid: false,
                message: 'Uno o más técnicos no pertenecen a la sucursal seleccionada.',
            }
        }
    }

    if (locationIds.length > 0) {
        const locations = await prisma.location.findMany({
            where: {
                id: {
                    in: locationIds,
                },
                branch: {
                    companyId,
                    id: branchId,
                },
            },
            select: {
                id: true,
            },
        })

        if (locations.length !== locationIds.length) {
            return {
                valid: false,
                message: 'Una o más ubicaciones no pertenecen a la sucursal seleccionada.',
            }
        }
    }

    return {
        valid: true,
        message: null,
    }
}

const validateClientCatalogsForBranch = async (
    branchId: string,
    typeClientId?: string | null,
    documentTypeId?: string | null,
) => {
    // El tipo de cliente y el tipo de documento son opcionales: solo se validan
    // los que realmente se enviaron.
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
                'El tipo de cliente o tipo de documento del cliente no pertenece a la sucursal seleccionada.',
        }
    }

    return {
        valid: true,
        message: null,
    }
}

export const createService = async (req: Request, res: Response) => {
    const parsed = CreateServicePayloadSchema.safeParse(req.body)
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Datos invalidos', details: parsed.error.issues })
    }

    const { clientId, newClient, devices, serviceDetails } = parsed.data
    const scope = await resolveCompanyScope(req)
    if (!scope) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Debes iniciar sesión para crear servicios.',
        })
    }

    if (scope.isTechnician && !scope.branchId) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: BRANCH_SCOPE_MESSAGE,
        })
    }

    if (scope.branchId && serviceDetails.branchId !== scope.branchId) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: BRANCH_SCOPE_MESSAGE,
        })
    }

    if (newClient && newClient.branchId !== serviceDetails.branchId) {
        return res.status(400).json({
            error: 'Relación inválida',
            message:
                'La sucursal del cliente nuevo debe coincidir con la sucursal del servicio.',
        })
    }

    const companyId = scope.companyId

    const receptionDate = new Date(serviceDetails.receptionDate)
    if (Number.isNaN(receptionDate.getTime())) {
        return res.status(400).json({
            error: 'Datos invalidos',
            message: 'La fecha de recepción no tiene un formato válido.',
        })
    }

    try {
        const [branchExists, statusExists, existingClient, newClientBranch] = await Promise.all([
            prisma.branch.findFirst({
                where: {
                    id: serviceDetails.branchId,
                    companyId,
                    ...(scope.branchId ? { id: scope.branchId } : {}),
                },
                select: { id: true },
            }),
            prisma.status.findFirst({
                where: {
                    id: serviceDetails.statusId,
                    branchId: serviceDetails.branchId,
                },
                select: { id: true },
            }),
            clientId
                ? prisma.client.findFirst({
                      where: {
                          id: clientId,
                          branchId: serviceDetails.branchId,
                          branch: {
                              companyId,
                          },
                      },
                      select: { id: true },
                  })
                : Promise.resolve(null),
            newClient?.branchId
                ? prisma.branch.findFirst({
                      where: {
                          id: newClient.branchId,
                          companyId,
                      },
                      select: {
                          id: true,
                      },
                  })
                : Promise.resolve(null),
        ])

        if (!branchExists) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: 'La sucursal seleccionada no existe.',
            })
        }

        if (!statusExists) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: 'El estatus seleccionado no existe.',
            })
        }

        if (clientId && !existingClient) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: 'El cliente seleccionado no existe o no pertenece a tu empresa.',
            })
        }

        if (newClient?.branchId && !newClientBranch) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: 'La sucursal del nuevo cliente no pertenece a tu empresa.',
            })
        }

        if (newClient) {
            const catalogValidation = await validateClientCatalogsForBranch(
                newClient.branchId,
                newClient.typeClientId,
                newClient.documentTypeId,
            )
            if (!catalogValidation.valid) {
                return res.status(400).json({
                    error: 'Relación inválida',
                    message: catalogValidation.message,
                })
            }
        }

        const validation = await validateDeviceRelationsWithinCompany(
            companyId,
            devices,
            serviceDetails.branchId,
        )
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: validation.message,
            })
        }

        const created = await prisma.$transaction(async (tx) => {
            let resolvedClientId = clientId ?? null

            if (!resolvedClientId && newClient) {
                const createdClient = await tx.client.create({
                    data: {
                        name: newClient.name.trim(),
                        phone: newClient.phone.trim(),
                        email: newClient.email?.trim() ?? '',
                        address: newClient.address?.trim() ?? '',
                        typeClientId: newClient.typeClientId || null,
                        documentTypeId: newClient.documentTypeId || null,
                        branchId: newClient.branchId,
                    },
                    select: { id: true },
                })
                resolvedClientId = createdClient.id
            }

            if (!resolvedClientId) {
                throw new Error('No se pudo resolver el cliente de la solicitud.')
            }

            const token = randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
            const tmpCode = `TMP-${token}`
            const tmpQrCode = `TMPQR-${token}`

            const serviceRequest = await tx.serviceRequest.create({
                data: {
                    code: tmpCode,
                    qrCode: tmpQrCode,
                    branchId: serviceDetails.branchId,
                    clientId: resolvedClientId,
                    statusId: serviceDetails.statusId,
                    receptionDate,
                    observations: serviceDetails.observations?.trim() ?? '',
                },
                select: { id: true },
            })

            const finalCode =
                serviceDetails.code?.trim() ||
                `SRV-${String(serviceRequest.id).padStart(6, '0')}`
            const finalQrCode = serviceDetails.qrCode?.trim() || finalCode

            await tx.serviceRequest.update({
                where: { id: serviceRequest.id },
                data: {
                    code: finalCode,
                    qrCode: finalQrCode,
                },
            })

            await Promise.all(
                devices.map((device) => {
                    const deliveryDate = device.deliveryDate
                        ? new Date(device.deliveryDate)
                        : receptionDate

                    return tx.service.create({
                        data: {
                            serviceRequestId: serviceRequest.id,
                            deviceTypeId: device.deviceTypeId,
                            brand: device.brand.trim(),
                            model: device.model.trim(),
                            imei: device.serialNumber?.trim() ?? '',
                            color: device.color?.trim() ?? '',
                            appearance: device.appearance?.trim() ?? '',
                            unlockType: device.unlockType?.trim() ?? '',
                            unlockCode: device.unlockCode?.trim() ?? '',
                            serviceDetail: device.problem.trim(),
                            serviceSolution: device.solution?.trim() ?? '',
                            cost: device.cost,
                            advance: device.advance,
                            technicianId: device.technicianId,
                            locationId: device.locationId,
                            deliveryDate: Number.isNaN(deliveryDate.getTime())
                                ? receptionDate
                                : deliveryDate,
                            deliveryTime: device.deliveryTime?.trim() ?? '',
                        },
                    })
                })
            )

            await tx.statusHistory.create({
                data: {
                    serviceRequestId: serviceRequest.id,
                    statusId: serviceDetails.statusId,
                    changedById: devices[0].technicianId,
                    date: receptionDate,
                },
            })

            return {
                id: serviceRequest.id,
                code: finalCode,
                qrCode: finalQrCode,
                clientId: resolvedClientId,
                devicesCount: devices.length,
            }
        })

        await ensureServiceEvidenceFolder(created.id).catch((error) => {
            console.error('No fue posible preparar carpeta de evidencias:', error)
        })

        return res.status(201).json(created)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    error: 'Conflicto',
                    message: 'Ya existe una solicitud con el folio o QR indicado.',
                })
            }
            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: 'Relación inválida',
                    message:
                        'Alguna relación enviada no existe (cliente, técnico, ubicación, estatus, sucursal o tipo de equipo).',
                })
            }
        }

        console.error('Error creando servicio:', error)
        return res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export const getAllServices = async (req: Request, res: Response) => {
    try {
        const scope = await resolveCompanyScope(req)
        if (!scope) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debes iniciar sesión para consultar servicios.',
            })
        }

        if (scope.isTechnician && !scope.branchId) {
            return res.status(200).json([])
        }

        const serviceRequests = await prisma.serviceRequest.findMany({
            where: {
                branch: {
                    companyId: scope.companyId,
                    ...(scope.branchId ? { id: scope.branchId } : {}),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                code: true,
                receptionDate: true,
                qrCode: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                status: {
                    select: {
                        id: true,
                        name: true,
                        colorHex: true,
                    },
                },
                services: {
                    orderBy: {
                        id: 'asc',
                    },
                    select: {
                        id: true,
                        brand: true,
                        model: true,
                        technician: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        })

        const result = serviceRequests.map((serviceRequest) => {
            const firstService = serviceRequest.services[0]

            return {
                id: serviceRequest.id,
                code: serviceRequest.code,
                receptionDate: serviceRequest.receptionDate,
                qrCode: serviceRequest.qrCode,
                client: serviceRequest.client.name,
                branch: serviceRequest.branch.name,
                status: serviceRequest.status.name,
                statusColor: serviceRequest.status.colorHex,
                device: firstService
                    ? `${firstService.brand} ${firstService.model}`.trim()
                    : 'Sin dispositivo',
                technician: firstService?.technician?.name ?? 'Sin técnico',
                devicesCount: serviceRequest.services.length,
            }
        })

        return res.status(200).json(result)
    } catch (error) {
        console.error('Error obteniendo servicios:', error)
        return res.status(500).json({
            error: 'Error al obtener servicios',
        })
    }
}

export const getServiceById = async (req: Request, res: Response) => {
    const serviceRequestId = parseServiceRequestId(req.params.id)
    if (!serviceRequestId) {
        return res.status(400).json({ error: 'El id del servicio es inválido' })
    }

    try {
        const scope = await resolveCompanyScope(req)
        if (!scope) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debes iniciar sesión para consultar servicios.',
            })
        }

        if (scope.isTechnician && !scope.branchId) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: BRANCH_SCOPE_MESSAGE,
            })
        }

        const serviceRequest = await prisma.serviceRequest.findFirst({
            where: {
                id: serviceRequestId,
                branch: {
                    companyId: scope.companyId,
                    ...(scope.branchId ? { id: scope.branchId } : {}),
                },
            },
            select: {
                id: true,
                code: true,
                qrCode: true,
                branchId: true,
                statusId: true,
                receptionDate: true,
                observations: true,
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        address: true,
                        typeClientId: true,
                        documentTypeId: true,
                        branchId: true,
                    },
                },
                services: {
                    orderBy: { id: 'asc' },
                    select: {
                        id: true,
                        deviceTypeId: true,
                        brand: true,
                        model: true,
                        imei: true,
                        color: true,
                        appearance: true,
                        unlockType: true,
                        unlockCode: true,
                        serviceDetail: true,
                        serviceSolution: true,
                        cost: true,
                        advance: true,
                        technicianId: true,
                        locationId: true,
                        deliveryDate: true,
                        deliveryTime: true,
                    },
                },
                cancellation: {
                    select: {
                        id: true,
                        statusId: true,
                        total: true,
                        totalPaid: true,
                        debt: true,
                        amount: true,
                        hasRefund: true,
                        refundMethod: true,
                        cashFromBox: true,
                        bankAccount: true,
                        bankFromBox: true,
                        sourceBoxName: true,
                        notes: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        })

        if (!serviceRequest) {
            return res.status(404).json({ error: 'Servicio no encontrado' })
        }

        const result = {
            id: serviceRequest.id,
            client: serviceRequest.client,
            devices: serviceRequest.services.map((device) => ({
                id: device.id,
                deviceTypeId: device.deviceTypeId,
                brand: device.brand,
                model: device.model,
                serialNumber: device.imei,
                color: device.color,
                appearance: device.appearance,
                unlockType: device.unlockType,
                unlockCode: device.unlockCode,
                problem: device.serviceDetail,
                solution: device.serviceSolution,
                cost: device.cost,
                advance: device.advance,
                technicianId: device.technicianId,
                locationId: device.locationId,
                deliveryDate: device.deliveryDate.toISOString().split('T')[0] ?? '',
                deliveryTime: device.deliveryTime ?? '',
            })),
            serviceDetails: {
                branchId: serviceRequest.branchId,
                receptionDate: serviceRequest.receptionDate.toISOString().split('T')[0] ?? '',
                statusId: serviceRequest.statusId,
                observations: serviceRequest.observations ?? '',
                code: serviceRequest.code,
                qrCode: serviceRequest.qrCode,
            },
            cancellation: serviceRequest.cancellation
                ? {
                      id: serviceRequest.cancellation.id,
                      statusId: serviceRequest.cancellation.statusId,
                      total: serviceRequest.cancellation.total,
                      totalPaid: serviceRequest.cancellation.totalPaid,
                      debt: serviceRequest.cancellation.debt,
                      amount: serviceRequest.cancellation.amount,
                      hasRefund: serviceRequest.cancellation.hasRefund,
                      refundMethod: serviceRequest.cancellation.refundMethod,
                      cashFromBox: serviceRequest.cancellation.cashFromBox,
                      bankAccount: serviceRequest.cancellation.bankAccount,
                      bankFromBox: serviceRequest.cancellation.bankFromBox,
                      sourceBoxName: serviceRequest.cancellation.sourceBoxName,
                      notes: serviceRequest.cancellation.notes,
                      createdAt: serviceRequest.cancellation.createdAt,
                      updatedAt: serviceRequest.cancellation.updatedAt,
                  }
                : null,
        }

        return res.status(200).json(result)
    } catch (error) {
        console.error('Error obteniendo detalle del servicio:', error)
        return res.status(500).json({
            error: 'Error al obtener detalle del servicio',
        })
    }
}

export const updateService = async (req: Request, res: Response) => {
    const serviceRequestId = parseServiceRequestId(req.params.id)
    if (!serviceRequestId) {
        return res.status(400).json({ error: 'El id del servicio es inválido' })
    }

    const parsed = CreateServicePayloadSchema.safeParse(req.body)
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Datos invalidos', details: parsed.error.issues })
    }

    const { clientId, newClient, devices, serviceDetails, cancellation } = parsed.data
    const scope = await resolveCompanyScope(req)
    if (!scope) {
        return res.status(401).json({
            error: 'No autorizado',
            message: 'Debes iniciar sesión para actualizar servicios.',
        })
    }

    if (scope.isTechnician && !scope.branchId) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: BRANCH_SCOPE_MESSAGE,
        })
    }

    if (scope.branchId && serviceDetails.branchId !== scope.branchId) {
        return res.status(403).json({
            error: 'Acceso denegado',
            message: BRANCH_SCOPE_MESSAGE,
        })
    }

    if (newClient && newClient.branchId !== serviceDetails.branchId) {
        return res.status(400).json({
            error: 'Relación inválida',
            message:
                'La sucursal del cliente nuevo debe coincidir con la sucursal del servicio.',
        })
    }

    const companyId = scope.companyId
    const receptionDate = new Date(serviceDetails.receptionDate)
    if (Number.isNaN(receptionDate.getTime())) {
        return res.status(400).json({
            error: 'Datos invalidos',
            message: 'La fecha de recepción no tiene un formato válido.',
        })
    }

    try {
        const [existingServiceRequest, branchExists, statusExists, existingClient, newClientBranch] =
            await Promise.all([
                prisma.serviceRequest.findFirst({
                    where: {
                        id: serviceRequestId,
                        branch: {
                            companyId,
                            ...(scope.branchId ? { id: scope.branchId } : {}),
                        },
                    },
                    select: {
                        id: true,
                        code: true,
                        qrCode: true,
                        statusId: true,
                    },
                }),
                prisma.branch.findFirst({
                    where: {
                        id: serviceDetails.branchId,
                        companyId,
                        ...(scope.branchId ? { id: scope.branchId } : {}),
                    },
                    select: { id: true },
                }),
                prisma.status.findFirst({
                    where: {
                        id: serviceDetails.statusId,
                        branchId: serviceDetails.branchId,
                    },
                    select: { id: true },
                }),
                clientId
                    ? prisma.client.findFirst({
                          where: {
                              id: clientId,
                              branchId: serviceDetails.branchId,
                              branch: {
                                  companyId,
                              },
                          },
                          select: { id: true },
                      })
                    : Promise.resolve(null),
                newClient?.branchId
                    ? prisma.branch.findFirst({
                          where: {
                              id: newClient.branchId,
                              companyId,
                          },
                          select: {
                              id: true,
                          },
                      })
                    : Promise.resolve(null),
            ])

        if (!existingServiceRequest) {
            return res.status(404).json({ error: 'Servicio no encontrado' })
        }

        if (!branchExists) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: 'La sucursal seleccionada no existe.',
            })
        }

        if (!statusExists) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: 'El estatus seleccionado no existe.',
            })
        }

        if (clientId && !existingClient) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: 'El cliente seleccionado no existe o no pertenece a tu empresa.',
            })
        }

        if (newClient?.branchId && !newClientBranch) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: 'La sucursal del nuevo cliente no pertenece a tu empresa.',
            })
        }

        if (newClient) {
            const catalogValidation = await validateClientCatalogsForBranch(
                newClient.branchId,
                newClient.typeClientId,
                newClient.documentTypeId,
            )
            if (!catalogValidation.valid) {
                return res.status(400).json({
                    error: 'Relación inválida',
                    message: catalogValidation.message,
                })
            }
        }

        const validation = await validateDeviceRelationsWithinCompany(
            companyId,
            devices,
            serviceDetails.branchId,
        )
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Relación inválida',
                message: validation.message,
            })
        }

        const updated = await prisma.$transaction(async (tx) => {
            let resolvedClientId = clientId ?? null

            if (!resolvedClientId && newClient) {
                const createdClient = await tx.client.create({
                    data: {
                        name: newClient.name.trim(),
                        phone: newClient.phone.trim(),
                        email: newClient.email?.trim() ?? '',
                        address: newClient.address?.trim() ?? '',
                        typeClientId: newClient.typeClientId || null,
                        documentTypeId: newClient.documentTypeId || null,
                        branchId: newClient.branchId,
                    },
                    select: { id: true },
                })
                resolvedClientId = createdClient.id
            }

            if (!resolvedClientId) {
                throw new Error('No se pudo resolver el cliente de la solicitud.')
            }

            const nextCode = serviceDetails.code?.trim() || existingServiceRequest.code
            const nextQrCode = serviceDetails.qrCode?.trim() || existingServiceRequest.qrCode

            await tx.serviceRequest.update({
                where: { id: serviceRequestId },
                data: {
                    code: nextCode,
                    qrCode: nextQrCode,
                    branchId: serviceDetails.branchId,
                    clientId: resolvedClientId,
                    statusId: serviceDetails.statusId,
                    receptionDate,
                    observations: serviceDetails.observations?.trim() ?? '',
                },
            })

            await tx.service.deleteMany({
                where: { serviceRequestId },
            })

            await Promise.all(
                devices.map((device) => {
                    const deliveryDate = device.deliveryDate
                        ? new Date(device.deliveryDate)
                        : receptionDate

                    return tx.service.create({
                        data: {
                            serviceRequestId,
                            deviceTypeId: device.deviceTypeId,
                            brand: device.brand.trim(),
                            model: device.model.trim(),
                            imei: device.serialNumber?.trim() ?? '',
                            color: device.color?.trim() ?? '',
                            appearance: device.appearance?.trim() ?? '',
                            unlockType: device.unlockType?.trim() ?? '',
                            unlockCode: device.unlockCode?.trim() ?? '',
                            serviceDetail: device.problem.trim(),
                            serviceSolution: device.solution?.trim() ?? '',
                            cost: device.cost,
                            advance: device.advance,
                            technicianId: device.technicianId,
                            locationId: device.locationId,
                            deliveryDate: Number.isNaN(deliveryDate.getTime())
                                ? receptionDate
                                : deliveryDate,
                            deliveryTime: device.deliveryTime?.trim() ?? '',
                        },
                    })
                })
            )

            if (existingServiceRequest.statusId !== serviceDetails.statusId) {
                await tx.statusHistory.create({
                    data: {
                        serviceRequestId,
                        statusId: serviceDetails.statusId,
                        changedById: devices[0].technicianId,
                        date: new Date(),
                    },
                })
            }

            if (cancellation) {
                const hasRefund = cancellation.hasRefund
                const refundMethod = hasRefund ? (cancellation.refundMethod ?? null) : null
                const fromBox =
                    refundMethod === 'CASH'
                        ? cancellation.cashFromBox
                        : refundMethod === 'BANK'
                          ? cancellation.bankFromBox
                          : null

                await tx.serviceCancellation.upsert({
                    where: { serviceRequestId },
                    create: {
                        serviceRequestId,
                        statusId: serviceDetails.statusId,
                        total: cancellation.total,
                        totalPaid: cancellation.totalPaid,
                        debt: cancellation.debt,
                        amount: cancellation.amount,
                        hasRefund,
                        refundMethod,
                        cashFromBox:
                            refundMethod === 'CASH' ? (cancellation.cashFromBox ?? null) : null,
                        bankAccount:
                            refundMethod === 'BANK'
                                ? (cancellation.bankAccount?.trim() || null)
                                : null,
                        bankFromBox:
                            refundMethod === 'BANK' ? (cancellation.bankFromBox ?? null) : null,
                        sourceBoxName:
                            fromBox === true
                                ? (cancellation.sourceBoxName?.trim() || null)
                                : null,
                        notes: cancellation.notes?.trim() || null,
                    },
                    update: {
                        statusId: serviceDetails.statusId,
                        total: cancellation.total,
                        totalPaid: cancellation.totalPaid,
                        debt: cancellation.debt,
                        amount: cancellation.amount,
                        hasRefund,
                        refundMethod,
                        cashFromBox:
                            refundMethod === 'CASH' ? (cancellation.cashFromBox ?? null) : null,
                        bankAccount:
                            refundMethod === 'BANK'
                                ? (cancellation.bankAccount?.trim() || null)
                                : null,
                        bankFromBox:
                            refundMethod === 'BANK' ? (cancellation.bankFromBox ?? null) : null,
                        sourceBoxName:
                            fromBox === true
                                ? (cancellation.sourceBoxName?.trim() || null)
                                : null,
                        notes: cancellation.notes?.trim() || null,
                    },
                })
            }

            return {
                id: serviceRequestId,
                code: nextCode,
                qrCode: nextQrCode,
                clientId: resolvedClientId,
                devicesCount: devices.length,
            }
        })

        await ensureServiceEvidenceFolder(serviceRequestId).catch((error) => {
            console.error('No fue posible preparar carpeta de evidencias:', error)
        })

        return res.status(200).json(updated)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    error: 'Conflicto',
                    message: 'Ya existe una solicitud con el folio o QR indicado.',
                })
            }
            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: 'Relación inválida',
                    message:
                        'Alguna relación enviada no existe (cliente, técnico, ubicación, estatus, sucursal o tipo de equipo).',
                })
            }
        }

        console.error('Error actualizando servicio:', error)
        return res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export const getServiceEvidenceByQr = async (req: Request, res: Response) => {
    const qrCode = parseQrCode(req.params.qrCode)
    if (!qrCode) {
        return res.status(400).json({ error: 'El código QR es inválido.' })
    }

    try {
        await runEvidenceCleanup()

        const serviceRequest = await prisma.serviceRequest.findUnique({
            where: { qrCode },
            select: {
                id: true,
                code: true,
                qrCode: true,
                receptionDate: true,
                observations: true,
                status: {
                    select: {
                        id: true,
                        name: true,
                        colorHex: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                attachments: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    select: {
                        id: true,
                        url: true,
                        description: true,
                        createdAt: true,
                    },
                },
            },
        })

        if (!serviceRequest) {
            return res.status(404).json({ error: 'Servicio no encontrado para este QR.' })
        }

        const expiration = await clearEvidenceForServiceIfExpired(serviceRequest.id)
        const evidenceState = expiration.state

        const attachments = expiration.cleaned
            ? []
            : serviceRequest.attachments.map((attachment) => ({
                  id: attachment.id,
                  url: buildPublicFileUrl(req, attachment.url),
                  relativeUrl: attachment.url,
                  description: attachment.description,
                  createdAt: attachment.createdAt,
              }))

        return res.status(200).json({
            serviceRequest: {
                id: serviceRequest.id,
                code: serviceRequest.code,
                qrCode: serviceRequest.qrCode,
                receptionDate: serviceRequest.receptionDate,
                observations: serviceRequest.observations,
                status: serviceRequest.status,
                branch: serviceRequest.branch,
                client: serviceRequest.client,
            },
            evidence: {
                attachments,
            },
            upload: {
                enabled: !evidenceState.expired,
                maxFilesPerUpload: MAX_EVIDENCE_FILES_PER_UPLOAD,
                fieldName: 'images',
            },
            cleanupPolicy: {
                retentionDays: evidenceState.retentionDays,
                terminalAt: evidenceState.terminalAt?.toISOString() ?? null,
                expiresAt: evidenceState.expiresAt?.toISOString() ?? null,
                expired: evidenceState.expired,
            },
        })
    } catch (error) {
        console.error('Error obteniendo evidencias por QR:', error)
        return res.status(500).json({
            error: 'No fue posible obtener las evidencias del servicio.',
        })
    }
}

export const uploadServiceEvidenceByQr = async (req: Request, res: Response) => {
    const qrCode = parseQrCode(req.params.qrCode)
    if (!qrCode) {
        return res.status(400).json({ error: 'El código QR es inválido.' })
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? []
    if (files.length === 0) {
        return res.status(400).json({
            error: 'Debes adjuntar al menos una imagen.',
        })
    }

    try {
        await runEvidenceCleanup()

        const serviceRequest = await prisma.serviceRequest.findUnique({
            where: { qrCode },
            select: {
                id: true,
                code: true,
                qrCode: true,
            },
        })

        if (!serviceRequest) {
            return res.status(404).json({ error: 'Servicio no encontrado para este QR.' })
        }

        const expiration = await clearEvidenceForServiceIfExpired(serviceRequest.id)
        if (expiration.state.expired) {
            return res.status(410).json({
                error: 'Las evidencias de este servicio ya expiraron y fueron eliminadas.',
                cleanupPolicy: {
                    retentionDays: expiration.state.retentionDays,
                    terminalAt: expiration.state.terminalAt?.toISOString() ?? null,
                    expiresAt: expiration.state.expiresAt?.toISOString() ?? null,
                    expired: expiration.state.expired,
                },
            })
        }

        const createdAttachments = []

        for (const file of files) {
            let stored: Awaited<ReturnType<typeof compressAndStoreEvidence>> | null = null
            try {
                stored = await compressAndStoreEvidence(serviceRequest.id, file)

                const createdAttachment = await prisma.attachment.create({
                    data: {
                        serviceRequestId: serviceRequest.id,
                        url: stored.publicPath,
                        description: file.originalname.trim() || null,
                    },
                    select: {
                        id: true,
                        url: true,
                        description: true,
                        createdAt: true,
                    },
                })

                createdAttachments.push({
                    id: createdAttachment.id,
                    url: buildPublicFileUrl(req, createdAttachment.url),
                    relativeUrl: createdAttachment.url,
                    description: createdAttachment.description,
                    createdAt: createdAttachment.createdAt,
                    originalBytes: stored.originalBytes,
                    compressedBytes: stored.compressedBytes,
                })
            } catch (error) {
                if (stored) {
                    await deleteStoredEvidenceFile(stored.absolutePath).catch(() => undefined)
                }
                throw error
            }
        }

        return res.status(201).json({
            serviceRequest: {
                id: serviceRequest.id,
                code: serviceRequest.code,
                qrCode: serviceRequest.qrCode,
            },
            uploadedCount: createdAttachments.length,
            attachments: createdAttachments,
        })
    } catch (error) {
        if (error instanceof EvidenceValidationError) {
            return res.status(400).json({
                error: 'Archivo inválido',
                message: error.message,
            })
        }

        console.error('Error subiendo evidencias por QR:', error)
        return res.status(500).json({
            error: 'No fue posible guardar las evidencias.',
        })
    }
}

const buildEmptyOverview = (branch: { id: string; name: string } | null) => ({
    branch,
    summary: {
        totalRequests: 0,
        totalDevices: 0,
        totalQuoted: 0,
        totalCollected: 0,
        totalPending: 0,
        clientsCount: 0,
        requestsThisMonth: 0,
        collectedThisMonth: 0,
        quotedThisMonth: 0,
    },
    statusBreakdown: [] as Array<{
        id: string
        name: string
        colorHex: string
        count: number
    }>,
    recentRequests: [] as Array<{
        id: number
        code: string
        client: string
        device: string
        devicesCount: number
        status: string
        statusColor: string
        receptionDate: Date
        total: number
    }>,
    topTechnicians: [] as Array<{
        id: string
        name: string
        devices: number
        collected: number
    }>,
    monthlyTrend: [] as Array<{ month: string; label: string; count: number }>,
})

const MONTH_LABELS_ES = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
]

export const getCompanyOverview = async (req: Request, res: Response) => {
    try {
        const scope = await resolveCompanyScope(req)
        if (!scope) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debes iniciar sesión para consultar el resumen.',
            })
        }

        // Un técnico sin sucursal activa no tiene datos que mostrar.
        if (scope.isTechnician && !scope.branchId) {
            return res.status(200).json(buildEmptyOverview(null))
        }

        const branchFilter = {
            companyId: scope.companyId,
            ...(scope.branchId ? { id: scope.branchId } : {}),
        }
        const requestWhere = { branch: branchFilter }
        const serviceWhere = { serviceRequest: { branch: branchFilter } }

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfTrend = new Date(now.getFullYear(), now.getMonth() - 5, 1)

        const activeBranch = scope.branchId
            ? await prisma.branch.findFirst({
                  where: { id: scope.branchId, companyId: scope.companyId },
                  select: { id: true, name: true },
              })
            : null

        const [
            totalRequests,
            serviceTotals,
            statusGroups,
            recentRequestsRaw,
            clientsCount,
            requestsThisMonth,
            monthTotals,
            technicianGroups,
            trendRequests,
        ] = await Promise.all([
            prisma.serviceRequest.count({ where: requestWhere }),
            prisma.service.aggregate({
                where: serviceWhere,
                _sum: { cost: true, advance: true },
                _count: { _all: true },
            }),
            prisma.serviceRequest.groupBy({
                by: ['statusId'],
                where: requestWhere,
                _count: { _all: true },
            }),
            prisma.serviceRequest.findMany({
                where: requestWhere,
                orderBy: { createdAt: 'desc' },
                take: 6,
                select: {
                    id: true,
                    code: true,
                    receptionDate: true,
                    client: { select: { name: true } },
                    status: { select: { name: true, colorHex: true } },
                    services: {
                        orderBy: { id: 'asc' },
                        select: { brand: true, model: true, cost: true },
                    },
                },
            }),
            prisma.client.count({ where: { branch: branchFilter } }),
            prisma.serviceRequest.count({
                where: { ...requestWhere, createdAt: { gte: startOfMonth } },
            }),
            prisma.service.aggregate({
                where: {
                    serviceRequest: {
                        branch: branchFilter,
                        createdAt: { gte: startOfMonth },
                    },
                },
                _sum: { cost: true, advance: true },
            }),
            prisma.service.groupBy({
                by: ['technicianId'],
                where: serviceWhere,
                _count: { _all: true },
                _sum: { advance: true },
            }),
            prisma.serviceRequest.findMany({
                where: { ...requestWhere, createdAt: { gte: startOfTrend } },
                select: { createdAt: true },
            }),
        ])

        const totalQuoted = serviceTotals._sum.cost ?? 0
        const totalCollected = serviceTotals._sum.advance ?? 0
        const quotedThisMonth = monthTotals._sum.cost ?? 0
        const collectedThisMonth = monthTotals._sum.advance ?? 0

        // Desglose por estatus (nombre + color) ordenado por cantidad.
        const statusIds = statusGroups.map((group) => group.statusId)
        const statuses = statusIds.length
            ? await prisma.status.findMany({
                  where: { id: { in: statusIds } },
                  select: { id: true, name: true, colorHex: true },
              })
            : []
        const statusById = new Map(statuses.map((status) => [status.id, status]))
        const statusBreakdown = statusGroups
            .map((group) => {
                const status = statusById.get(group.statusId)
                return {
                    id: group.statusId,
                    name: status?.name ?? 'Sin estatus',
                    colorHex: status?.colorHex ?? '#64748B',
                    count: group._count._all,
                }
            })
            .sort((a, b) => b.count - a.count)

        // Órdenes recientes con su total cotizado.
        const recentRequests = recentRequestsRaw.map((request) => {
            const first = request.services[0]
            const total = request.services.reduce(
                (sum, service) => sum + (service.cost ?? 0),
                0,
            )
            return {
                id: request.id,
                code: request.code,
                client: request.client.name,
                device: first ? `${first.brand} ${first.model}`.trim() : 'Sin dispositivo',
                devicesCount: request.services.length,
                status: request.status.name,
                statusColor: request.status.colorHex,
                receptionDate: request.receptionDate,
                total,
            }
        })

        // Técnicos con más equipos atendidos.
        const sortedTechnicians = [...technicianGroups]
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 5)
        const technicianIds = sortedTechnicians.map((group) => group.technicianId)
        const technicians = technicianIds.length
            ? await prisma.user.findMany({
                  where: { id: { in: technicianIds } },
                  select: { id: true, name: true },
              })
            : []
        const technicianById = new Map(technicians.map((tech) => [tech.id, tech]))
        const topTechnicians = sortedTechnicians.map((group) => ({
            id: group.technicianId,
            name: technicianById.get(group.technicianId)?.name ?? 'Sin técnico',
            devices: group._count._all,
            collected: group._sum.advance ?? 0,
        }))

        // Tendencia de los últimos 6 meses (incluye el mes actual).
        const trendBuckets: Array<{ month: string; label: string; count: number }> = []
        const trendIndex = new Map<string, number>()
        for (let offset = 5; offset >= 0; offset -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            trendIndex.set(key, trendBuckets.length)
            trendBuckets.push({
                month: key,
                label: MONTH_LABELS_ES[date.getMonth()],
                count: 0,
            })
        }
        for (const request of trendRequests) {
            const created = new Date(request.createdAt)
            const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
            const index = trendIndex.get(key)
            if (index !== undefined) {
                trendBuckets[index].count += 1
            }
        }

        return res.status(200).json({
            branch: activeBranch,
            summary: {
                totalRequests,
                totalDevices: serviceTotals._count._all,
                totalQuoted,
                totalCollected,
                totalPending: Math.max(totalQuoted - totalCollected, 0),
                clientsCount,
                requestsThisMonth,
                collectedThisMonth,
                quotedThisMonth,
            },
            statusBreakdown,
            recentRequests,
            topTechnicians,
            monthlyTrend: trendBuckets,
        })
    } catch (error) {
        console.error('Error obteniendo resumen del negocio:', error)
        return res.status(500).json({
            error: 'Error al obtener el resumen del negocio',
        })
    }
}

export const getServiceTicket = async (req: Request, res: Response) => {
    const serviceRequestId = parseServiceRequestId(req.params.id)
    if (!serviceRequestId) {
        return res.status(400).json({ error: 'El id del servicio es inválido' })
    }

    try {
        const scope = await resolveCompanyScope(req)
        if (!scope) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debes iniciar sesión para generar el ticket.',
            })
        }

        if (scope.isTechnician && !scope.branchId) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: BRANCH_SCOPE_MESSAGE,
            })
        }

        const serviceRequest = await prisma.serviceRequest.findFirst({
            where: {
                id: serviceRequestId,
                branch: {
                    companyId: scope.companyId,
                    ...(scope.branchId ? { id: scope.branchId } : {}),
                },
            },
            select: {
                id: true,
                code: true,
                receptionDate: true,
                observations: true,
                branch: {
                    select: {
                        name: true,
                        address: true,
                        company: { select: { name: true } },
                    },
                },
                client: {
                    select: { name: true, phone: true, email: true, address: true },
                },
                services: {
                    orderBy: { id: 'asc' },
                    select: {
                        brand: true,
                        model: true,
                        color: true,
                        appearance: true,
                        unlockType: true,
                        unlockCode: true,
                        imei: true,
                        serviceDetail: true,
                        serviceSolution: true,
                        cost: true,
                        advance: true,
                        deviceType: { select: { name: true } },
                        technician: { select: { name: true } },
                    },
                },
            },
        })

        if (!serviceRequest) {
            return res.status(404).json({ error: 'Servicio no encontrado' })
        }

        const devices = serviceRequest.services.map((service) => ({
            deviceType: service.deviceType?.name ?? '',
            brand: service.brand,
            model: service.model,
            color: service.color,
            appearance: service.appearance,
            unlockType: service.unlockType,
            unlockCode: service.unlockCode,
            serialNumber: service.imei,
            problem: service.serviceDetail,
            solution: service.serviceSolution,
            technician: service.technician?.name ?? '',
            cost: service.cost,
            advance: service.advance,
            debt: Math.max(service.cost - service.advance, 0),
        }))

        const total = devices.reduce((sum, device) => sum + device.cost, 0)
        const paid = devices.reduce((sum, device) => sum + device.advance, 0)

        return res.status(200).json({
            folio: serviceRequest.id,
            code: serviceRequest.code,
            receptionDate: serviceRequest.receptionDate,
            observations: serviceRequest.observations ?? '',
            company: { name: serviceRequest.branch.company?.name ?? '' },
            branch: {
                name: serviceRequest.branch.name,
                address: serviceRequest.branch.address,
            },
            client: serviceRequest.client,
            devices,
            totals: { total, paid, debt: Math.max(total - paid, 0) },
        })
    } catch (error) {
        console.error('Error generando ticket del servicio:', error)
        return res.status(500).json({
            error: 'Error al generar el ticket del servicio',
        })
    }
}

export const getServiceCatalogs = async (req: Request, res: Response) => {
    try {
        const scope = await resolveCompanyScope(req)
        if (!scope) {
            return res.status(401).json({
                error: 'No autorizado',
                message: 'Debes iniciar sesión para consultar catálogos.',
            })
        }

        if (scope.isTechnician && !scope.branchId) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: BRANCH_SCOPE_MESSAGE,
            })
        }

        if (!scope.branchId) {
            return res.status(400).json({
                error: 'Sucursal requerida',
                message: 'Debes seleccionar una sucursal activa para consultar catálogos.',
            })
        }

        const companyId = scope.companyId
        await ensureDefaultClientCatalogs({
            companyId,
            branchId: scope.branchId,
        })

        const [
            clients,
            branches,
            statuses,
            deviceTypes,
            techniciansByRole,
            locations,
            typeClients,
            documentTypes,
        ] = await Promise.all([
            prisma.client.findMany({
                where: {
                    branch: {
                        companyId,
                        ...(scope.branchId ? { id: scope.branchId } : {}),
                    },
                },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                    address: true,
                    typeClientId: true,
                    documentTypeId: true,
                    branchId: true,
                },
            }),
            prisma.branch.findMany({
                where: {
                    companyId,
                    ...(scope.branchId ? { id: scope.branchId } : {}),
                },
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),
            prisma.status.findMany({
                where: {
                    branchId: scope.branchId,
                },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, colorHex: true },
            }),
            prisma.deviceType.findMany({
                orderBy: { name: 'asc' },
                where: {
                    branchId: scope.branchId,
                    OR: [{ isActive: true }, { isActive: null }],
                },
                select: { id: true, name: true },
            }),
            prisma.user.findMany({
                orderBy: { name: 'asc' },
                where: {
                    companyId,
                    ...(scope.branchId ? { branchId: scope.branchId } : {}),
                    role: {
                        name: {
                            in: ['Técnico', 'Tecnico', 'Tech'],
                        },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    branchId: true,
                },
            }),
            prisma.location.findMany({
                where: {
                    branch: {
                        companyId,
                        ...(scope.branchId ? { id: scope.branchId } : {}),
                    },
                },
                orderBy: { name: 'asc' },
                select: { id: true, name: true, branchId: true },
            }),
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
        ])

        const technicians =
            techniciansByRole.length > 0
                ? techniciansByRole
                : await prisma.user.findMany({
                      where: {
                          companyId,
                          ...(scope.branchId ? { branchId: scope.branchId } : {}),
                      },
                      orderBy: { name: 'asc' },
                      select: {
                          id: true,
                          name: true,
                          email: true,
                          branchId: true,
                      },
                  })

        return res.status(200).json({
            clients,
            branches,
            statuses,
            deviceTypes,
            technicians,
            locations,
            typeClients,
            documentTypes,
        })
    } catch (error) {
        console.error('Error obteniendo catálogos para servicios:', error)
        return res.status(500).json({
            error: 'Error al obtener catálogos para servicios',
        })
    }
}
