import axios from 'axios'

const GENERIC_BACKEND_LABELS = new Set([
  'Error',
  'Error interno del servidor',
  'Internal Server Error',
  'Conflicto',
  'Acceso denegado',
  'No autorizado',
  'No encontrado',
  'Datos inválidos',
  'Datos invalidos',
])

/**
 * Devuelve un mensaje de error legible para el usuario a partir de un error de axios.
 *
 * Prioriza el `message` que envía el backend (que ya viene traducido y sin detalles
 * internos), luego un `error` específico, y si no hay nada útil usa el `fallback`.
 * Nunca expone stacks ni errores crudos de Prisma/BD.
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    // Sin respuesta del servidor => problema de red/conexión.
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
    }

    const data = error.response.data as
      | { message?: unknown; error?: unknown }
      | undefined

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message.trim()
    }

    // Algunos endpoints solo mandan `error` con una etiqueta; si es específica la usamos.
    if (
      typeof data?.error === 'string' &&
      data.error.trim() &&
      !GENERIC_BACKEND_LABELS.has(data.error.trim())
    ) {
      return data.error.trim()
    }
  }

  return fallback
}
