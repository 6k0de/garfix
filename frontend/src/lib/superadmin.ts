import type { AdminAccountRecord } from '@/services/admin/admin.api'

export type BillingCycle = 'monthly' | 'yearly'
export type ClientStatus = 'active' | 'trial' | 'suspended' | 'expired' | 'canceled'
export type PaymentStatus = 'current' | 'overdue' | 'pending'

export interface SuperAdminPlan {
  id: string
  name: string
  includedBranches: number
  monthlyPrice: number
  yearlyPrice: number
  extraBranchCost: number
}

export const SUPERADMIN_PLANS: Record<string, SuperAdminPlan> = {
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    includedBranches: 1,
    monthlyPrice: 259,
    yearlyPrice: 4990,
    extraBranchCost: 199,
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    includedBranches: 3,
    monthlyPrice: 500,
    yearlyPrice: 11990,
    extraBranchCost: 149,
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    includedBranches: 10,
    monthlyPrice: 1500,
    yearlyPrice: 29990,
    extraBranchCost: 99,
  },
}

export interface SuperAdminClientView {
  id: string
  companyId: string
  companyName: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  status: ClientStatus
  paymentStatus: PaymentStatus
  plan: SuperAdminPlan
  billingCycle: BillingCycle
  includedBranches: number
  extraBranches: number
  extraBranchPrices: number[]
  totalBranches: number
  baseMonthlyPrice: number
  customPricing: boolean
  customMonthlyPrice: number
  customYearlyPrice: number
  discount: number
  monthlyRevenue: number
  yearlyRevenue: number
  subscriptionStartDate: string
  subscriptionEndDate: string
  notes: string
  activeUsers: number
  totalUsers: number
  lastActivity: string
  branches: AdminAccountRecord['branches']
  metrics: AdminAccountRecord['metrics']
  adminIsActive: boolean
  adminId: string
}

const normalizeClientStatus = (value: string): ClientStatus => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  if (normalized === 'active' || normalized === 'activo') return 'active'
  if (normalized === 'trial' || normalized === 'prueba') return 'trial'
  if (normalized === 'suspended' || normalized === 'suspendido') return 'suspended'
  if (normalized === 'expired' || normalized === 'expirado') return 'expired'
  if (normalized === 'canceled' || normalized === 'cancelado') return 'canceled'
  return 'active'
}

const resolvePaymentStatus = (status: ClientStatus): PaymentStatus => {
  if (status === 'active') return 'current'
  if (status === 'trial') return 'pending'
  return 'overdue'
}

const resolvePlan = (planCode: string): SuperAdminPlan => {
  const normalizedCode = planCode.trim().toUpperCase()
  return (
    SUPERADMIN_PLANS[normalizedCode] || {
      id: normalizedCode || 'CUSTOM',
      name: normalizedCode || 'Custom',
      includedBranches: 1,
      monthlyPrice: 0,
      yearlyPrice: 0,
      extraBranchCost: 150,
    }
  )
}

const addDays = (baseIsoDate: string, days: number) => {
  const base = new Date(baseIsoDate)
  if (Number.isNaN(base.getTime())) {
    const now = new Date()
    now.setDate(now.getDate() + days)
    return now.toISOString()
  }
  base.setDate(base.getDate() + days)
  return base.toISOString()
}

const sanitizeExtraBranchPrices = (values: Array<number | null | undefined> | null | undefined) =>
  (values ?? [])
    .map((value) => Number(value ?? 0))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((value) => Number(value.toFixed(2)))

const buildDefaultExtraBranchPrices = (extraBranches: number, defaultPrice: number) =>
  Array.from({ length: Math.max(0, extraBranches) }, () => Number(defaultPrice.toFixed(2)))

export const buildSuperAdminClientView = (
  row: AdminAccountRecord,
): SuperAdminClientView => {
  const plan = resolvePlan(row.company.subscriptionPlan)
  const normalizedStatus = normalizeClientStatus(row.company.status)
  const includedBranches = Math.min(row.company.branchLimit, plan.includedBranches)
  const configuredExtraBranches = Math.max(0, row.company.branchLimit - includedBranches)
  const persistedExtraBranchPrices = sanitizeExtraBranchPrices(row.company.extraBranchPrices)
  const normalizedExtraBranchPrices =
    persistedExtraBranchPrices.length >= configuredExtraBranches
      ? persistedExtraBranchPrices
      : [
          ...persistedExtraBranchPrices,
          ...buildDefaultExtraBranchPrices(
            configuredExtraBranches - persistedExtraBranchPrices.length,
            plan.extraBranchCost,
          ),
        ]
  const totalBranches = Math.max(
    row.company.branchLimit,
    includedBranches + normalizedExtraBranchPrices.length,
  )
  const extraBranches = Math.max(0, totalBranches - includedBranches)
  const extraBranchPriceTotal = normalizedExtraBranchPrices
    .slice(0, extraBranches)
    .reduce((total, value) => total + value, 0)
  const baseMonthlyPrice = Math.max(0, row.company.subscriptionPrice - extraBranchPriceTotal)
  const monthlyRevenue = row.company.subscriptionPrice
  const yearlyRevenue = monthlyRevenue * 12
  const customPricing = Math.abs(baseMonthlyPrice - plan.monthlyPrice) > 0.01

  return {
    id: row.company.id,
    companyId: row.company.id,
    companyName: row.company.name,
    contactPerson: row.admin.name,
    contactEmail: row.admin.email || row.admin.username || 'Sin contacto',
    contactPhone: 'No registrado',
    status: normalizedStatus,
    paymentStatus: resolvePaymentStatus(normalizedStatus),
    plan,
    billingCycle: 'monthly',
    includedBranches,
    extraBranches,
    extraBranchPrices: normalizedExtraBranchPrices.slice(0, extraBranches),
    totalBranches,
    baseMonthlyPrice,
    customPricing,
    customMonthlyPrice: baseMonthlyPrice,
    customYearlyPrice: baseMonthlyPrice * 10,
    discount: 0,
    monthlyRevenue,
    yearlyRevenue,
    subscriptionStartDate: row.company.createdAt,
    subscriptionEndDate: addDays(row.company.createdAt, 30),
    notes: '',
    activeUsers: row.admin.isActive ? 1 : 0,
    totalUsers: 1,
    lastActivity: row.company.createdAt,
    branches: row.branches,
    metrics: row.metrics,
    adminIsActive: row.admin.isActive,
    adminId: row.admin.id,
  }
}

export interface EditSubscriptionResult {
  companyId: string
  subscriptionPlan: string
  subscriptionPrice: number
  baseMonthlyPrice: number
  extraBranchPrices: number[]
  discountPercent: number
  status: ClientStatus
  branchLimit: number
  isAdminActive: boolean
}
