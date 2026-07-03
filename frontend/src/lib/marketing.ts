import { SUPERADMIN_PLANS } from './superadmin'

export type MarketingBillingCycle = 'monthly' | 'yearly'
export type MarketingPlanId = 'BASIC' | 'PRO' | 'ENTERPRISE'
export const YEARLY_PLAN_DISCOUNT_RATE = 0.1

export const getDiscountedYearlyPrice = (monthlyPrice: number) =>
  Math.round(monthlyPrice * 12 * (1 - YEARLY_PLAN_DISCOUNT_RATE))

export interface MarketingPlan {
  id: MarketingPlanId
  includedBranches: number
  monthlyPrice: number
  yearlyPrice: number
  extraBranchCost: number
  featured?: boolean
  accent: string
}

const DEFAULT_USD_EXCHANGE_RATE = 17

const MARKETING_USD_EXCHANGE_RATE = (() => {
  const rawValue = Number(import.meta.env.VITE_MARKETING_USD_EXCHANGE_RATE)
  if (Number.isFinite(rawValue) && rawValue > 0) {
    return rawValue
  }

  return DEFAULT_USD_EXCHANGE_RATE
})()

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: 'BASIC',
    includedBranches: SUPERADMIN_PLANS.BASIC.includedBranches,
    monthlyPrice: SUPERADMIN_PLANS.BASIC.monthlyPrice,
    yearlyPrice: getDiscountedYearlyPrice(SUPERADMIN_PLANS.BASIC.monthlyPrice),
    extraBranchCost: SUPERADMIN_PLANS.BASIC.extraBranchCost,
    accent: 'bg-emerald-50',
  },
  {
    id: 'PRO',
    includedBranches: SUPERADMIN_PLANS.PRO.includedBranches,
    monthlyPrice: SUPERADMIN_PLANS.PRO.monthlyPrice,
    yearlyPrice: getDiscountedYearlyPrice(SUPERADMIN_PLANS.PRO.monthlyPrice),
    extraBranchCost: SUPERADMIN_PLANS.PRO.extraBranchCost,
    featured: true,
    accent: 'bg-indigo-50',
  },
  {
    id: 'ENTERPRISE',
    includedBranches: SUPERADMIN_PLANS.ENTERPRISE.includedBranches,
    monthlyPrice: SUPERADMIN_PLANS.ENTERPRISE.monthlyPrice,
    yearlyPrice: getDiscountedYearlyPrice(SUPERADMIN_PLANS.ENTERPRISE.monthlyPrice),
    extraBranchCost: SUPERADMIN_PLANS.ENTERPRISE.extraBranchCost,
    accent: 'bg-amber-50',
  },
]

export const DEFAULT_MARKETING_PLAN_ID: MarketingPlanId = 'PRO'

export const getMarketingPlan = (planId: string | null | undefined) => {
  const normalized = (planId ?? '').trim().toUpperCase()
  return (
    MARKETING_PLANS.find((plan) => plan.id === normalized) ??
    MARKETING_PLANS.find((plan) => plan.id === DEFAULT_MARKETING_PLAN_ID) ??
    MARKETING_PLANS[0]
  )
}

export const isEnglishLanguage = (language: string | null | undefined) =>
  (language ?? '').toLowerCase().startsWith('en')

export const getMarketingCurrencyValue = (
  valueInMxn: number,
  language: string | null | undefined,
) => {
  if (isEnglishLanguage(language)) {
    return valueInMxn / MARKETING_USD_EXCHANGE_RATE
  }

  return valueInMxn
}

export const formatMarketingCurrency = (
  valueInMxn: number,
  language: string | null | undefined,
) =>
  new Intl.NumberFormat(isEnglishLanguage(language) ? 'en-US' : 'es-MX', {
    style: 'currency',
    currency: isEnglishLanguage(language) ? 'USD' : 'MXN',
    maximumFractionDigits: 0,
  }).format(getMarketingCurrencyValue(valueInMxn, language))

export const getMarketingUsdExchangeRate = () => MARKETING_USD_EXCHANGE_RATE
