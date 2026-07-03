import { Prisma } from '@prisma/client'
import type { Response } from 'express'

const uniqueFieldMessage = (target: unknown): string => {
  const fields = Array.isArray(target)
    ? target.map((value) => String(value).toLowerCase())
    : typeof target === 'string'
      ? [target.toLowerCase()]
      : []

  const includes = (needle: string) => fields.some((field) => field.includes(needle))

  if (includes('email') || includes('correo')) {
    return 'Ya existe un registro con ese correo electrónico.'
  }
  if (includes('username') || includes('usuario')) {
    return 'Ya existe un registro con ese nombre de usuario.'
  }
  if (includes('name') || includes('nombre')) {
    return 'Ya existe un registro con ese nombre.'
  }
  return 'Ya existe un registro con esos datos.'
}

export interface MappedHttpError {
  status: number
  message: string
}

/**
 * Traduce errores conocidos de Prisma a un estado HTTP + mensaje claro para el usuario.
 * Devuelve null si el error no corresponde a un caso conocido (para que el llamador
 * use un mensaje genérico sin exponer detalles internos).
 */
export const mapPrismaError = (error: unknown): MappedHttpError | null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return { status: 409, message: uniqueFieldMessage(error.meta?.target) }
      case 'P2025':
        return { status: 404, message: 'No se encontró el registro solicitado.' }
      case 'P2003':
        return {
          status: 409,
          message:
            'No se puede completar la operación porque el registro está relacionado con otros datos.',
        }
      default:
        return null
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: 'Los datos enviados no son válidos.' }
  }

  return null
}

/**
 * Responde de forma segura ante un error: si es un error conocido de Prisma lo traduce
 * a un mensaje claro; en cualquier otro caso registra el detalle real en el servidor y
 * devuelve un mensaje genérico (nunca expone Prisma ni la base de datos al cliente).
 */
export const sendError = (
  res: Response,
  error: unknown,
  fallbackMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.',
  fallbackStatus = 500,
) => {
  const mapped = mapPrismaError(error)
  if (mapped) {
    return res.status(mapped.status).json({ error: 'Error', message: mapped.message })
  }

  console.error('Error no controlado:', error)
  return res.status(fallbackStatus).json({ error: 'Error', message: fallbackMessage })
}
