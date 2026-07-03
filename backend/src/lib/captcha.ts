import type { Request, Response, NextFunction } from 'express'

// Verificación de CAPTCHA (Cloudflare Turnstile) lista para activar.
// - Si TURNSTILE_SECRET no está configurado, el middleware NO hace nada (no-op),
//   por lo que el comportamiento actual no cambia.
// - Al configurar el secreto (y el widget en el frontend con VITE_TURNSTILE_SITE_KEY),
//   se exige y valida el token "captchaToken" del cuerpo de la petición.
const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export const verifyCaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const secret = process.env.TURNSTILE_SECRET?.trim()
  if (!secret) {
    return next()
  }

  const body = req.body as { captchaToken?: unknown }
  const token = typeof body?.captchaToken === 'string' ? body.captchaToken : ''

  if (!token) {
    return res.status(400).json({
      error: 'Verificación requerida',
      message: 'Completa la verificación de seguridad e inténtalo de nuevo.',
    })
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: req.ip ?? '',
      }),
    })
    const data = (await response.json()) as { success?: boolean }

    if (!data.success) {
      return res.status(403).json({
        error: 'Verificación fallida',
        message: 'La verificación de seguridad no fue válida. Inténtalo de nuevo.',
      })
    }
  } catch {
    return res.status(503).json({
      error: 'Verificación no disponible',
      message: 'No fue posible verificar la seguridad. Inténtalo más tarde.',
    })
  }

  // Evita que el token llegue a los validadores Zod posteriores (esquemas estrictos).
  if (req.body && typeof req.body === 'object') {
    delete (req.body as Record<string, unknown>).captchaToken
  }

  next()
}
