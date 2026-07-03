import rateLimit, { type Options } from 'express-rate-limit'
import type { Request, Response } from 'express'

const TOO_MANY_MESSAGE =
  'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'

const handler = (_req: Request, res: Response) => {
  res.status(429).json({ error: 'Demasiadas solicitudes', message: TOO_MANY_MESSAGE })
}

const base: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  handler,
}

const minutes = (n: number) => n * 60 * 1000
const fromEnv = (key: string, fallback: number) => {
  const parsed = Number(process.env[key])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// Límite general anti-DoS aplicado a toda la API.
export const globalLimiter = rateLimit({
  ...base,
  windowMs: minutes(1),
  limit: fromEnv('RATE_LIMIT_GLOBAL_PER_MIN', 300),
})

// Inicio de sesión: protege contra fuerza bruta (solo cuentan los intentos fallidos).
export const loginLimiter = rateLimit({
  ...base,
  windowMs: minutes(15),
  limit: fromEnv('RATE_LIMIT_LOGIN', 20),
  skipSuccessfulRequests: true,
})

// Registro público: frena la creación masiva de cuentas.
export const signupLimiter = rateLimit({
  ...base,
  windowMs: minutes(60),
  limit: fromEnv('RATE_LIMIT_SIGNUP', 10),
})

// Creación de checkout/preferencia de pago: evita el spam de preferencias en Mercado Pago.
export const paymentLimiter = rateLimit({
  ...base,
  windowMs: minutes(60),
  limit: fromEnv('RATE_LIMIT_CHECKOUT', 15),
})

// Webhook de pagos: limita la amplificación.
export const webhookLimiter = rateLimit({
  ...base,
  windowMs: minutes(1),
  limit: fromEnv('RATE_LIMIT_WEBHOOK', 60),
})

// Endpoints públicos de evidencias por QR (subida/lectura).
export const evidenceLimiter = rateLimit({
  ...base,
  windowMs: minutes(1),
  limit: fromEnv('RATE_LIMIT_EVIDENCE', 30),
})
