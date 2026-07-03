import type React from 'react'
import { ArrowRightIcon, CheckCircle2Icon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { MarketingBillingCycle, MarketingPlan } from '@/lib/marketing'
import { formatMarketingCurrency } from '@/lib/marketing'

interface PlanCardProps {
  plan: MarketingPlan
  billingCycle: MarketingBillingCycle
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, billingCycle }) => {
  const { t, i18n } = useTranslation('landing')
  const isYearly = billingCycle === 'yearly'
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const priceSuffix = t(
    isYearly ? 'pricing.billing.year' : 'pricing.billing.month'
  )
  const planName = t(`pricing.plans.${plan.id}.name`)
  const planTagline = t(`pricing.plans.${plan.id}.tagline`)
  const planDescription = t(`pricing.plans.${plan.id}.description`)
  const planFeatures = ['one', 'two', 'three', 'four'].map((key) =>
    t(`pricing.plans.${plan.id}.features.${key}`)
  )

  return (
    <article
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_18px_60px_rgba(86,102,120,0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgba(86,102,120,0.18)]',
        plan.featured &&
          'border-indigo-200 shadow-[0_26px_80px_rgba(99,102,241,0.22)] ring-2 ring-indigo-300/60 lg:-translate-y-2 lg:scale-[1.02]',
      )}
    >
      <div
        className={cn(
          'flex min-h-[124px] items-start justify-between gap-5 p-7 pb-6',
          plan.accent,
        )}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            {planName}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {planTagline}
          </p>
        </div>
        {plan.featured && (
          <span className="shrink-0 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold leading-5 text-white">
            {t('pricing.planCard.featured')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-7">

        <div className="mt-8">
          <div className="flex items-end gap-2">
            <span
              className="text-4xl font-semibold tracking-tight text-slate-900"
              style={{ fontFamily: '"Fraunces", serif' }}
            >
              {formatMarketingCurrency(price, i18n.language)}
            </span>
            <span className="pb-1 text-sm text-slate-500">{priceSuffix}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {planDescription}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#e7ece4] bg-[#f7faf6] p-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{t('pricing.planCard.includedBranches')}</span>
            <strong className="text-slate-900">{plan.includedBranches}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>{t('pricing.planCard.extraBranchCost')}</span>
            <strong className="text-slate-900">
              {formatMarketingCurrency(plan.extraBranchCost, i18n.language)}
            </strong>
          </div>
        </div>

        <ul className="mt-8 space-y-3">
          {planFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
              <CheckCircle2Icon size={18} className="mt-0.5 shrink-0 text-teal-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          asChild
          size="lg"
          className={cn(
            'mt-8 h-12 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white transition hover:bg-slate-800',
            plan.featured && 'bg-teal-600 hover:bg-teal-700',
          )}
        >
          <Link to={`/checkout?plan=${plan.id}&cycle=${billingCycle}`}>
            {t('pricing.planCard.choose', { plan: planName })}
            <ArrowRightIcon size={18} />
          </Link>
        </Button>
      </div>
    </article>
  )
}
