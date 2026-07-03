import crypto from 'node:crypto'
import type { Request } from 'express'

export interface MercadoPagoPreference {
  id: string
  init_point?: string
  sandbox_init_point?: string
}

export interface MercadoPagoPayment {
  id: string | number
  status?: string
  status_detail?: string
  external_reference?: string
  metadata?: {
    signup_payment_id?: string
  }
  [key: string]: unknown
}

const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com'

const getEnv = (key: string, fallback = '') => process.env[key]?.trim() || fallback

export const getQueryValue = (value: unknown) => {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

export const getMercadoPagoPaymentId = (req: Request) => {
  const body = req.body as { data?: { id?: unknown }; resource?: unknown }

  const fromQuery =
    getQueryValue(req.query.payment_id) ||
    getQueryValue(req.query.collection_id) ||
    getQueryValue(req.query.id) ||
    getQueryValue(req.query['data.id'])

  if (fromQuery) return fromQuery
  if (typeof body?.data?.id === 'string' || typeof body?.data?.id === 'number') {
    return String(body.data.id)
  }
  if (typeof body?.resource === 'string') {
    return body.resource.match(/\/payments\/([^/?#]+)/)?.[1] ?? null
  }

  return null
}

export const mercadoPagoRequest = async <T>(path: string, body?: unknown): Promise<T> => {
  const accessToken = getEnv('MERCADO_PAGO_ACCESS_TOKEN')
  if (!accessToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN no está configurado.')
  }

  const response = await fetch(`${MERCADO_PAGO_API_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    throw new Error(`Mercado Pago respondió ${response.status}: ${await response.text()}`)
  }

  return response.json() as Promise<T>
}

export const isValidMercadoPagoWebhook = (req: Request) => {
  const secret = getEnv('MERCADO_PAGO_WEBHOOK_SECRET')
  if (!secret) {
    // En producción el secreto es obligatorio: sin él rechazamos el webhook.
    // En desarrollo se permite (MP no llega a localhost) para facilitar pruebas.
    return process.env.NODE_ENV !== 'production'
  }

  const paymentId = getMercadoPagoPaymentId(req)
  const signature = req.get('x-signature')
  const requestId = req.get('x-request-id')

  if (!paymentId || !signature || !requestId) return false

  const signatureParts = Object.fromEntries(
    signature
      .split(',')
      .map((part) => part.split('=').map((value) => value.trim()))
      .filter(([key, value]) => key && value),
  ) as Record<string, string>

  if (!signatureParts.ts || !signatureParts.v1) return false

  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${signatureParts.ts};`
  const expected = Buffer.from(
    crypto.createHmac('sha256', secret).update(manifest).digest('hex'),
    'hex',
  )
  const received = Buffer.from(signatureParts.v1, 'hex')

  return expected.length === received.length && crypto.timingSafeEqual(expected, received)
}
