import { api } from '@/lib/api'

export interface AdminAccountRecord {
  company: {
    id: string
    name: string
    email: string
    status: string
    subscriptionPlan: string
    subscriptionPrice: number
    extraBranchPrices: number[]
    branchLimit: number
    usedBranches: number
    availableBranches: number
    createdAt: string
  }
  admin: {
    id: string
    name: string
    email: string | null
    username: string | null
    isActive: boolean
  }
  branches: Array<{
    id: string
    name: string
    address: string
  }>
  metrics: {
    serviceRequestsCount: number
    servicesCount: number
    totalServiceCost: number
    totalServiceAdvance: number
    totalServicePending: number
  }
}

export interface CreateAdminAccountPayload {
  name: string
  email: string
  username?: string | null
  password: string
  companyName: string
  subscriptionPlan: string
  subscriptionPrice: number
  extraBranchPrices?: number[]
  status: string
  branchLimit: number
  initialBranchName?: string | null
  initialBranchAddress?: string | null
}

export interface UpdateAdminSubscriptionPayload {
  subscriptionPlan?: string
  subscriptionPrice?: number
  baseMonthlyPrice?: number
  extraBranchPrices?: number[]
  discountPercent?: number
  status?: string
  branchLimit?: number
  isAdminActive?: boolean
}

export interface AddCompanyBranchPayload {
  name: string
  address: string
}

export interface SuperAdminOverview {
  summary: {
    clients: number
    activeClients: number
    inactiveClients: number
    totalBranchLimit: number
    usedBranches: number
    availableBranches: number
    totalSubscriptionPrice: number
    totalServiceQuoted: number
    totalServiceCollected: number
    totalServicePending: number
    totalServiceRequests: number
    totalServices: number
    estimatedIncome: number
  }
  plans: Array<{
    plan: string
    clients: number
    activeClients: number
    monthlyPrice: number
    totalBranchLimit: number
    usedBranches: number
    availableBranches: number
    totalServiceQuoted: number
    totalServiceCollected: number
    totalServicePending: number
  }>
  topClientsByRevenue: Array<{
    companyId: string
    companyName: string
    subscriptionPlan: string
    monthlyPrice: number
    serviceCollected: number
    serviceQuoted: number
    totalIncome: number
  }>
  users: Array<{
    userId: string
    name: string
    email: string
    companyId: string
    companyName: string
    subscriptionPlan: string
    branchLimit: number
    usedBranches: number
    availableBranches: number
    monthlyPrice: number
    serviceCollected: number
    estimatedIncome: number
  }>
}

export const getAdminAccounts = async (): Promise<AdminAccountRecord[]> => {
  const { data } = await api.get('/superadmin/accounts')
  return data
}

export const getSuperAdminOverview = async (): Promise<SuperAdminOverview> => {
  const { data } = await api.get('/superadmin/overview')
  return data
}

export const createAdminAccount = async (payload: CreateAdminAccountPayload) => {
  const { data } = await api.post('/superadmin/accounts', payload)
  return data
}

export const updateAdminSubscription = async (
  companyId: string,
  payload: UpdateAdminSubscriptionPayload
) => {
  const { data } = await api.patch(`/superadmin/accounts/${companyId}/subscription`, payload)
  return data
}

export const addCompanyBranch = async (
  companyId: string,
  payload: AddCompanyBranchPayload
) => {
  const { data } = await api.post(`/superadmin/accounts/${companyId}/branches`, payload)
  return data
}

export const deleteUserAccount = async (userId: string) => {
  const { data } = await api.delete(`/superadmin/users/${userId}`)
  return data
}
