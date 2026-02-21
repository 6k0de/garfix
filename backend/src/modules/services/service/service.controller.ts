import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { CreateServicePayloadSchema } from './service.schema.js'
import { prisma } from '../../../lib/prisma.js'
import { ensureDefaultClientCatalogs } from '../../../lib/defaultCatalogs.js'
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

export const createService = async (req: Request, res: Response) => {
    const parsed = CreateServicePayloadSchema.safeParse(req.body)
    if (!parsed.success) {
        return res
            .status(400)
            .json({ error: 'Datos invalidos', details: parsed.error.issues })
    }

    const { clientId, newClient, devices, serviceDetails } = parsed.data

    const receptionDate = new Date(serviceDetails.receptionDate)
    if (Number.isNaN(receptionDate.getTime())) {
        return res.status(400).json({
            error: 'Datos invalidos',
            message: 'La fecha de recepción no tiene un formato válido.',
        })
    }

    try {
        const [branchExists, statusExists, existingClient] = await Promise.all([
            prisma.branch.findUnique({
                where: { id: serviceDetails.branchId },
                select: { id: true },
            }),
            prisma.status.findUnique({
                where: { id: serviceDetails.statusId },
                select: { id: true },
            }),
            clientId
                ? prisma.client.findUnique({
                      where: { id: clientId },
                      select: { id: true },
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
                message: 'El cliente seleccionado no existe.',
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
                        typeClientId: newClient.typeClientId,
                        documentTypeId: newClient.documentTypeId,
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
                    meta: error.meta,
                })
            }
            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: 'Relación inválida',
                    message:
                        'Alguna relación enviada no existe (cliente, técnico, ubicación, estatus, sucursal o tipo de equipo).',
                    meta: error.meta,
                })
            }
        }

        console.error('Error creando servicio:', error)
        return res.status(500).json({ error: 'Error interno del servidor' })
    }
}

export const getAllServices = async (_: Request, res: Response) => {
    try {
        const serviceRequests = await prisma.serviceRequest.findMany({
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
            details: error instanceof Error ? error.message : error,
        })
    }
}

export const getServiceById = async (req: Request, res: Response) => {
    const serviceRequestId = parseServiceRequestId(req.params.id)
    if (!serviceRequestId) {
        return res.status(400).json({ error: 'El id del servicio es inválido' })
    }

    try {
        const serviceRequest = await prisma.serviceRequest.findUnique({
            where: { id: serviceRequestId },
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
        }

        return res.status(200).json(result)
    } catch (error) {
        console.error('Error obteniendo detalle del servicio:', error)
        return res.status(500).json({
            error: 'Error al obtener detalle del servicio',
            details: error instanceof Error ? error.message : error,
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

    const { clientId, newClient, devices, serviceDetails } = parsed.data
    const receptionDate = new Date(serviceDetails.receptionDate)
    if (Number.isNaN(receptionDate.getTime())) {
        return res.status(400).json({
            error: 'Datos invalidos',
            message: 'La fecha de recepción no tiene un formato válido.',
        })
    }

    try {
        const [existingServiceRequest, branchExists, statusExists, existingClient] =
            await Promise.all([
                prisma.serviceRequest.findUnique({
                    where: { id: serviceRequestId },
                    select: {
                        id: true,
                        code: true,
                        qrCode: true,
                        statusId: true,
                    },
                }),
                prisma.branch.findUnique({
                    where: { id: serviceDetails.branchId },
                    select: { id: true },
                }),
                prisma.status.findUnique({
                    where: { id: serviceDetails.statusId },
                    select: { id: true },
                }),
                clientId
                    ? prisma.client.findUnique({
                          where: { id: clientId },
                          select: { id: true },
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
                message: 'El cliente seleccionado no existe.',
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
                        typeClientId: newClient.typeClientId,
                        documentTypeId: newClient.documentTypeId,
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
                    meta: error.meta,
                })
            }
            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: 'Relación inválida',
                    message:
                        'Alguna relación enviada no existe (cliente, técnico, ubicación, estatus, sucursal o tipo de equipo).',
                    meta: error.meta,
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

export const getServiceCatalogs = async (_: Request, res: Response) => {
    try {
        await ensureDefaultClientCatalogs()

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
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),
            prisma.status.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),
            prisma.deviceType.findMany({
                orderBy: { name: 'asc' },
                where: {
                    OR: [{ isActive: true }, { isActive: null }],
                },
                select: { id: true, name: true },
            }),
            prisma.user.findMany({
                orderBy: { name: 'asc' },
                where: {
                    role: {
                        name: {
                            in: ['Técnico', 'Tecnico'],
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
                orderBy: { name: 'asc' },
                select: { id: true, name: true, branchId: true },
            }),
            prisma.typeClient.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),
            prisma.documentType.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),
        ])

        const technicians =
            techniciansByRole.length > 0
                ? techniciansByRole
                : await prisma.user.findMany({
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
            details: error instanceof Error ? error.message : error,
        })
    }
}
