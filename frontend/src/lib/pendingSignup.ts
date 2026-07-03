// Marca local del pago de alta "pendiente". Mercado Pago descarta las back_urls
// en localhost, así que al volver recuperamos el pago desde aquí. Para evitar que
// una marca obsoleta deje al usuario atrapado en la pantalla de "pendiente",
// guardamos también una marca de tiempo y la caducamos automáticamente.
const PENDING_SIGNUP_KEY = 'garfix.pendingSignupPaymentId'
const PENDING_TTL_MS = 30 * 60 * 1000 // 30 minutos

const hasWindow = typeof window !== 'undefined'

export const setPendingSignup = (id: string) => {
  if (!hasWindow) return
  try {
    window.localStorage.setItem(
      PENDING_SIGNUP_KEY,
      JSON.stringify({ id, ts: Date.now() }),
    )
  } catch {
    // Si localStorage no está disponible, simplemente no persistimos.
  }
}

export const getPendingSignup = (): string | null => {
  if (!hasWindow) return null
  try {
    const raw = window.localStorage.getItem(PENDING_SIGNUP_KEY)
    if (!raw) return null

    // Compatibilidad con el formato anterior (string plano sin timestamp).
    if (!raw.startsWith('{')) return raw.trim() || null

    const parsed = JSON.parse(raw) as { id?: string; ts?: number }
    if (!parsed?.id) {
      window.localStorage.removeItem(PENDING_SIGNUP_KEY)
      return null
    }
    if (parsed.ts && Date.now() - parsed.ts > PENDING_TTL_MS) {
      window.localStorage.removeItem(PENDING_SIGNUP_KEY)
      return null
    }
    return parsed.id
  } catch {
    window.localStorage.removeItem(PENDING_SIGNUP_KEY)
    return null
  }
}

export const clearPendingSignup = () => {
  if (!hasWindow) return
  try {
    window.localStorage.removeItem(PENDING_SIGNUP_KEY)
  } catch {
    // sin acción
  }
}
