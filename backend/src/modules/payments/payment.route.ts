import { Router } from 'express'
import { paymentLimiter, webhookLimiter } from '../../lib/rateLimit.js'
import { verifyCaptcha } from '../../lib/captcha.js'
import * as paymentController from './payment.controller.js'

const paymentRoute = Router()

paymentRoute.post('/checkout', paymentLimiter, verifyCaptcha, paymentController.createSignupPayment)
paymentRoute.post('/mercado-pago/webhook', webhookLimiter, paymentController.mercadoPagoWebhook)
paymentRoute.get('/signup/:signupPaymentId/status', paymentController.getSignupPaymentStatus)

export default paymentRoute
