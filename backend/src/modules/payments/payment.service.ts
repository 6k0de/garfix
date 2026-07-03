import bcrypt from 'bcrypt'
import { Prisma, type PublicSignupPayment } from '@prisma/client'
import type { Request } from 'express'
import {
  createPublicSignupAccount,
  createSessionPayload,
  resolveSignupPlan,
} from '../auth/auth.controller.js'
import type { SignupInput } from '../auth/auth.schema.js'
import { prisma } from '../../lib/prisma.js'
import type { CreateSignupPaymentInput } from './payment.schema.js'
import {
  mercadoPagoRequest,
  type MercadoPagoPayment,
  type MercadoPagoPreference,
} from './mercado-pago.client.js'

const getEnv = (key: string, fallback = '') => process.env[key]?.trim() || fallback
const normalizeUrl = (value: string) => value.replace(/\/+$/, '')

const isPublicHttpsUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)
  } catch {
    return false
  }
}

const toLocalPaymentStatus = (status?: string) => {
  if (status === 'approved') return 'approved'
  if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(status ?? '')) {
    return 'rejected'
  }
  return 'pending'
}

const buildCheckoutReturnUrl = ({
  baseUrl,
  signupPaymentId,
  status,
  plan,
  billingCycle,
}: {
  baseUrl: string
  signupPaymentId: string
  status: 'success' | 'pending' | 'failure'
  plan: string
  billingCycle: string
}) => {
  const url = new URL('/checkout', baseUrl)
  url.searchParams.set('signupPaymentId', signupPaymentId)
  url.searchParams.set('paymentReturn', status)
  url.searchParams.set('plan', plan)
  url.searchParams.set('cycle', billingCycle)
  return url.toString()
}

const activateSignupPayment = async (signupPayment: PublicSignupPayment) => {
  if (signupPayment.userId) {
    return { companyId: signupPayment.companyId, userId: signupPayment.userId }
  }

  const payload: SignupInput = {
    name: signupPayment.adminName,
    email: signupPayment.email,
    username: signupPayment.username,
    password: 'PaidSignupPassword1!',
    companyName: signupPayment.companyName,
    subscriptionPlan: signupPayment.subscriptionPlan as SignupInput['subscriptionPlan'],
    initialBranchName: signupPayment.initialBranchName,
    initialBranchAddress: signupPayment.initialBranchAddress,
  }

  const created = await createPublicSignupAccount({
    payload,
    passwordHash: signupPayment.passwordHash,
    status: 'active',
  })

  await prisma.publicSignupPayment.update({
    where: { id: signupPayment.id },
    data: {
      status: 'approved',
      companyId: created.companyId,
      userId: created.userId,
    },
  })

  return created
}

export const createSignupCheckout = async (input: CreateSignupPaymentInput) => {
  const plan = resolveSignupPlan(input.subscriptionPlan)
  const amount = input.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  const email = input.email.trim().toLowerCase()
  const username = input.username?.trim().toLowerCase() || null

  const [existingUser, existingCompany] = await Promise.all([
    prisma.user.findFirst({
      where: { OR: username ? [{ email }, { username }] : [{ email }] },
      select: { id: true },
    }),
    prisma.customerCompany.findUnique({ where: { email }, select: { id: true } }),
  ])

  if (existingUser || existingCompany) {
    const error = new Error('El correo o usuario ya están registrados.')
    error.name = 'SignupConflictError'
    throw error
  }

  const signupPayment = await prisma.publicSignupPayment.create({
    data: {
      amount,
      billingCycle: input.billingCycle,
      subscriptionPlan: plan.id,
      companyName: input.companyName.trim(),
      adminName: input.name.trim(),
      email,
      username,
      passwordHash: await bcrypt.hash(input.password, 12),
      initialBranchName: input.initialBranchName?.trim() || 'Sucursal principal',
      initialBranchAddress: input.initialBranchAddress?.trim() || 'Dirección pendiente',
    },
  })

  const frontendUrl = normalizeUrl(
    getEnv('FRONTEND_PUBLIC_URL', getEnv('APP_PUBLIC_URL', 'http://app.garfix.mx/')),
  )
  const apiUrl = normalizeUrl(
    getEnv('API_PUBLIC_URL', getEnv('BACKEND_PUBLIC_URL', 'https://api.garfix.mx/')),
  )
  const backUrls = {
    success: buildCheckoutReturnUrl({
      baseUrl: frontendUrl,
      signupPaymentId: signupPayment.id,
      status: 'success',
      plan: plan.id,
      billingCycle: input.billingCycle,
    }),
    pending: buildCheckoutReturnUrl({
      baseUrl: frontendUrl,
      signupPaymentId: signupPayment.id,
      status: 'pending',
      plan: plan.id,
      billingCycle: input.billingCycle,
    }),
    failure: buildCheckoutReturnUrl({
      baseUrl: frontendUrl,
      signupPaymentId: signupPayment.id,
      status: 'failure',
      plan: plan.id,
      billingCycle: input.billingCycle,
    }),
  }

  const preference = await mercadoPagoRequest<MercadoPagoPreference>('/checkout/preferences', {
    items: [
      {
        id: plan.id,
        title: `Garfix ${plan.id} ${input.billingCycle === 'yearly' ? 'anual' : 'mensual'}`,
        quantity: 1,
        currency_id: 'MXN',
        unit_price: amount,
      },
    ],
    //payer: { name: input.name.trim(), email },
    back_urls: backUrls,
    external_reference: signupPayment.id,
    notification_url: new URL('/api/payments/mercado-pago/webhook', apiUrl).toString(),
    metadata: {
      signup_payment_id: signupPayment.id,
      plan: plan.id,
      billing_cycle: input.billingCycle,
    },
    ...(isPublicHttpsUrl(backUrls.success) ? { auto_return: 'approved' } : {}),
  })

  const updated = await prisma.publicSignupPayment.update({
    where: { id: signupPayment.id },
    data: {
      mercadoPagoPreferenceId: preference.id,
      mercadoPagoInitPoint: preference.init_point ?? null,
      mercadoPagoSandboxInitPoint: preference.sandbox_init_point ?? null,
    },
  })

  return {
    id: updated.id,
    status: updated.status,
    preferenceId: updated.mercadoPagoPreferenceId,
    initPoint: updated.mercadoPagoInitPoint,
    sandboxInitPoint: updated.mercadoPagoSandboxInitPoint,
  }
}

const applyMercadoPagoPayment = async (mercadoPagoPayment: MercadoPagoPayment) => {
  const signupPaymentId =
    mercadoPagoPayment.external_reference || mercadoPagoPayment.metadata?.signup_payment_id

  if (!signupPaymentId) return null

  const signupPayment = await prisma.publicSignupPayment.update({
    where: { id: signupPaymentId },
    data: {
      status: toLocalPaymentStatus(mercadoPagoPayment.status),
      mercadoPagoStatus: mercadoPagoPayment.status ?? null,
      mercadoPagoStatusDetail: mercadoPagoPayment.status_detail ?? null,
      mercadoPagoPaymentId: String(mercadoPagoPayment.id),
      rawPayment: mercadoPagoPayment as Prisma.InputJsonValue,
    },
  })

  if (signupPayment.status === 'approved') {
    await activateSignupPayment(signupPayment)
  }

  return signupPayment
}

export const syncSignupPayment = async (paymentId: string) => {
  const mercadoPagoPayment = await mercadoPagoRequest<MercadoPagoPayment>(
    `/v1/payments/${encodeURIComponent(paymentId)}`,
  )
  return applyMercadoPagoPayment(mercadoPagoPayment)
}

// Recupera el estado sin depender de las back_urls (que MP descarta cuando apuntan
// a localhost/http): busca el último pago asociado al registro por external_reference.
export const syncSignupPaymentByReference = async (signupPaymentId: string) => {
  const existing = await prisma.publicSignupPayment.findUnique({
    where: { id: signupPaymentId },
  })
  if (!existing) return null
  if (existing.status !== 'pending') return existing

  const search = await mercadoPagoRequest<{ results?: MercadoPagoPayment[] }>(
    `/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(
      signupPaymentId,
    )}`,
  )
  const payment = search.results?.find((result) => result?.id != null)
  if (!payment) return existing

  return applyMercadoPagoPayment(payment)
}

export const getSignupPaymentResult = async (signupPaymentId: string, req: Request) => {
  const signupPayment = await prisma.publicSignupPayment.findUnique({
    where: { id: signupPaymentId },
  })

  if (!signupPayment) return null

  const activated =
    signupPayment.status === 'approved'
      ? await activateSignupPayment(signupPayment)
      : null

  return {
    id: signupPayment.id,
    status: signupPayment.status,
    mercadoPagoStatus: signupPayment.mercadoPagoStatus,
    mercadoPagoStatusDetail: signupPayment.mercadoPagoStatusDetail,
    plan: signupPayment.subscriptionPlan,
    billingCycle: signupPayment.billingCycle,
    amount: signupPayment.amount,
    session: activated?.userId ? await createSessionPayload(activated.userId, req) : null,
  }
}
