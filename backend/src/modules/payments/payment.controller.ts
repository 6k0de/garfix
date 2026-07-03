import type { Request, Response } from 'express'
import { createSignupPaymentSchema } from './payment.schema.js'
import {
  getMercadoPagoPaymentId,
  getQueryValue,
  isValidMercadoPagoWebhook,
} from './mercado-pago.client.js'
import {
  createSignupCheckout,
  getSignupPaymentResult,
  syncSignupPayment,
  syncSignupPaymentByReference,
} from './payment.service.js'

const paymentIdFromReturn = (req: Request) =>
  getQueryValue(req.query.payment_id) ||
  getQueryValue(req.query.collection_id) ||
  getQueryValue(req.query.id)

export const createSignupPayment = async (req: Request, res: Response) => {
  const parsed = createSignupPaymentSchema.safeParse(req.body)
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Datos inválidos', details: parsed.error.issues })
  }

  try {
    return res.status(201).json(await createSignupCheckout(parsed.data))
  } catch (error) {
    if (error instanceof Error && error.name === 'SignupConflictError') {
      return res.status(409).json({ error: 'Conflicto', message: error.message })
    }

    console.error('Error creando preferencia de Mercado Pago:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No fue posible iniciar el pago. Inténtalo de nuevo más tarde.',
    })
  }
}

export const mercadoPagoWebhook = async (req: Request, res: Response) => {
  if (!isValidMercadoPagoWebhook(req)) {
    return res.status(401).json({ error: 'Firma inválida' })
  }

  const paymentId = getMercadoPagoPaymentId(req)
  if (paymentId) {
    syncSignupPayment(paymentId).catch((error) => {
      console.error('Error procesando webhook de Mercado Pago:', error)
    })
  }

  return res.status(200).json({ received: true })
}

export const getSignupPaymentStatus = async (req: Request, res: Response) => {
  try {
    const paymentId = paymentIdFromReturn(req)
    if (paymentId) {
      await syncSignupPayment(paymentId)
    } else {
      await syncSignupPaymentByReference(req.params.signupPaymentId)
    }

    const result = await getSignupPaymentResult(req.params.signupPaymentId, req)
    if (!result) {
      return res.status(404).json({
        error: 'No encontrado',
        message: 'No fue posible encontrar la solicitud de pago.',
      })
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Error consultando estado de pago:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No fue posible consultar el pago. Inténtalo de nuevo más tarde.',
    })
  }
}
