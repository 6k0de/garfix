// Utilidades de seguridad: validación de entorno en producción, registro de
// eventos de seguridad y bloqueo temporal por intentos de inicio de sesión.

/**
 * Aborta el arranque en producción si faltan variables de entorno críticas,
 * evitando despliegues inseguros (secretos vacíos / valores por defecto).
 */
export const assertProductionEnv = () => {
  if (process.env.NODE_ENV !== 'production') return

  const required = [
    'DATABASE_URL',
    'SUPERADMIN_PASSWORD',
    'MERCADO_PAGO_ACCESS_TOKEN',
    'MERCADO_PAGO_WEBHOOK_SECRET',
  ]
  const missing = required.filter((key) => !process.env[key]?.trim())

  if (missing.length > 0) {
    throw new Error(
      `Configuración insegura: faltan variables obligatorias en producción: ${missing.join(', ')}.`,
    )
  }
}

/** Log estructurado de eventos de seguridad (auditable / agregable en producción). */
export const logSecurityEvent = (
  event: string,
  data: Record<string, unknown> = {},
) => {
  console.warn(
    JSON.stringify({
      level: 'security',
      event,
      ts: new Date().toISOString(),
      ...data,
    }),
  )
}

// --- Bloqueo temporal por intentos fallidos de login (en memoria) ---
// La clave combina identificador + IP: limita la fuerza bruta por cuenta/origen
// sin permitir que un atacante bloquee globalmente la cuenta de una víctima.
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_FAILS = 5
const MAP_HARD_CAP = 50_000

const failedLogins = new Map<string, { count: number; first: number }>()

const pruneExpired = () => {
  const now = Date.now()
  for (const [key, entry] of failedLogins) {
    if (now - entry.first > LOGIN_WINDOW_MS) failedLogins.delete(key)
  }
}

export const isLoginLocked = (key: string) => {
  const entry = failedLogins.get(key)
  if (!entry) return false
  if (Date.now() - entry.first > LOGIN_WINDOW_MS) {
    failedLogins.delete(key)
    return false
  }
  return entry.count >= LOGIN_MAX_FAILS
}

export const registerFailedLogin = (key: string) => {
  if (failedLogins.size > MAP_HARD_CAP) pruneExpired()
  const now = Date.now()
  const entry = failedLogins.get(key)
  if (!entry || now - entry.first > LOGIN_WINDOW_MS) {
    failedLogins.set(key, { count: 1, first: now })
    return
  }
  entry.count += 1
}

export const clearFailedLogins = (key: string) => {
  failedLogins.delete(key)
}
