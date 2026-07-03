import { api } from '@/lib/api'
import type { AuthUser, LoginResponse } from '@/lib/auth'
import type { MarketingPlanId } from '@/lib/marketing'

export interface LoginPayload {
  identifier: string
  password: string
}

export interface RegisterCompanyPayload {
  name: string
  email: string
  username?: string | null
  password: string
  companyName: string
  subscriptionPlan: MarketingPlanId
  initialBranchName?: string | null
  initialBranchAddress?: string | null
}

export interface CreateSignupPaymentPayload extends RegisterCompanyPayload {
  billingCycle: 'monthly' | 'yearly'
}

export interface SignupPaymentResponse {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  preferenceId: string | null
  initPoint: string | null
  sandboxInitPoint: string | null
}

export interface SignupPaymentStatusResponse {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  mercadoPagoStatus: string | null
  mercadoPagoStatusDetail: string | null
  plan: MarketingPlanId
  billingCycle: 'monthly' | 'yearly'
  amount: number
  session: LoginResponse | null
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export const registerCompany = async (
  payload: RegisterCompanyPayload
): Promise<LoginResponse> => {
  const { data } = await api.post('/auth/signup', payload)
  return data
}

export const createSignupPayment = async (
  payload: CreateSignupPaymentPayload
): Promise<SignupPaymentResponse> => {
  const { data } = await api.post('/payments/checkout', payload)
  return data
}

export const getSignupPaymentStatus = async (
  signupPaymentId: string,
  params?: {
    payment_id?: string | null
    collection_id?: string | null
  }
): Promise<SignupPaymentStatusResponse> => {
  const { data } = await api.get(`/payments/signup/${signupPaymentId}/status`, {
    params,
  })
  return data
}

export const getCurrentSession = async (): Promise<{ user: AuthUser }> => {
  const { data } = await api.get('/auth/me')
  return data
}

export const logout = async () => {
  await api.post('/auth/logout')
}
