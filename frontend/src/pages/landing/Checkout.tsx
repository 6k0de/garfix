import React, { useMemo, useState } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftIcon,
  Building2Icon,
  CheckCircle2Icon,
  CreditCardIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  ShieldCheckIcon,
  User2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LanguajeSwitch } from '@/components/ui/LanguajeSwitcher'
import {
  formatMarketingCurrency,
  getMarketingPlan,
  type MarketingBillingCycle,
  type MarketingPlanId,
} from '@/lib/marketing'
import { createSignupPayment } from '@/services/auth/auth.api'
import { getPendingSignup, setPendingSignup } from '@/lib/pendingSignup'
import { CheckoutReturn } from './CheckoutReturn'

interface SignupFormState {
  companyName: string
  name: string
  email: string
  username: string
  password: string
  initialBranchName: string
  initialBranchAddress: string
}

const initialFormValues: SignupFormState = {
  companyName: '',
  name: '',
  email: '',
  username: '',
  password: '',
  initialBranchName: '',
  initialBranchAddress: '',
}

const planIds: MarketingPlanId[] = ['BASIC', 'PRO', 'ENTERPRISE']
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export const LandingCheckout: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [formValues, setFormValues] = useState<SignupFormState>(initialFormValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { t, i18n } = useTranslation('landing')

  const mode = searchParams.get('mode') === 'demo' ? 'demo' : 'checkout'
  const billingCycle: MarketingBillingCycle =
    searchParams.get('cycle') === 'yearly' ? 'yearly' : 'monthly'

  const selectedPlan = useMemo(
    () => getMarketingPlan(searchParams.get('plan')),
    [searchParams],
  )

  const displayedPrice =
    billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice

  const selectedPlanName = t(`pricing.plans.${selectedPlan.id}.name`)
  const selectedPlanDescription = t(`pricing.plans.${selectedPlan.id}.description`)
  const selectedPlanFeatures = ['one', 'two', 'three', 'four'].map((key) =>
    t(`pricing.plans.${selectedPlan.id}.features.${key}`)
  )

  const updateSelection = (planId: MarketingPlanId, nextCycle = billingCycle) => {
    setSearchParams({
      plan: planId,
      cycle: nextCycle,
      mode,
    })
  }

  const updateField = (field: keyof SignupFormState, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!formValues.companyName.trim()) {
      nextErrors.companyName = t('checkout.form.companyName.error')
    }
    if (!formValues.name.trim()) {
      nextErrors.name = t('checkout.form.name.error')
    }
    if (!formValues.email.trim() || !isValidEmail(formValues.email)) {
      nextErrors.email = t('checkout.form.email.error')
    }
    if (!formValues.password.trim() || formValues.password.trim().length < 8) {
      nextErrors.password = t('checkout.form.password.error')
    }
    if (!formValues.initialBranchName.trim()) {
      nextErrors.initialBranchName = t('checkout.form.branchName.error')
    }
    if (!formValues.initialBranchAddress.trim()) {
      nextErrors.initialBranchAddress = t('checkout.form.branchAddress.error')
    }

    return nextErrors
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createSignupPayment({
        companyName: formValues.companyName.trim(),
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        username: formValues.username.trim() || null,
        password: formValues.password.trim(),
        subscriptionPlan: selectedPlan.id,
        billingCycle,
        initialBranchName: formValues.initialBranchName.trim(),
        initialBranchAddress: formValues.initialBranchAddress.trim(),
      })

      const redirectUrl = response.initPoint || response.sandboxInitPoint
      if (!redirectUrl) {
        throw new Error(t('checkout.paymentReturn.redirectError'))
      }

      // Marcamos "redirigiendo" para mostrar una transición a Mercado Pago en lugar
      // de la pantalla de estado/pendiente justo antes de salir del sitio.
      setPendingSignup(response.id)
      setIsRedirecting(true)
      window.location.assign(redirectUrl)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string } | undefined)?.message ||
          t('checkout.toast.genericError')
        toast.error(message)
      } else {
        toast.error(error instanceof Error ? error.message : t('checkout.toast.unexpectedError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mientras se redirige a Mercado Pago mostramos una transición (no la pantalla de
  // estado), evitando el "flash" de pago pendiente justo antes de salir del sitio.
  if (isRedirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f6f2] px-4 text-center">
        <Loader2Icon size={36} className="animate-spin text-teal-600" />
        <p className="text-lg font-medium text-slate-700">{t('checkout.redirecting')}</p>
      </div>
    )
  }

  // Si el usuario vuelve de Mercado Pago (o hay un pago pendiente guardado),
  // mostramos la pantalla dedicada de estado en lugar del formulario.
  const returnPaymentId = searchParams.get('signupPaymentId') ?? getPendingSignup()

  if (returnPaymentId) {
    return <CheckoutReturn signupPaymentId={returnPaymentId} />
  }

  return (
    <div className="min-h-screen bg-[#f6f6f2] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <Toaster />
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button
            asChild
            variant="outline"
            className="group rounded-full border-slate-200 bg-white/80 px-4 text-slate-600 shadow-sm transition hover:border-teal-300 hover:bg-white hover:text-teal-700"
          >
            <Link to="/landing">
              <ArrowLeftIcon
                size={18}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              {t('checkout.back')}
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <LanguajeSwitch />
            <Button
              asChild
              variant="ghost"
              className="rounded-full px-4 text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
            >
              <Link to="/login">{t('checkout.login')}</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[36px] border border-white/80 bg-white/88 p-7 shadow-[0_20px_70px_rgba(105,123,144,0.14)] sm:p-9">
            <span className="inline-flex rounded-full border border-[#ccfbf1] bg-[#f0fdfa] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {mode === 'demo'
                ? t('checkout.eyebrow.demo')
                : t('checkout.eyebrow.checkout')}
            </span>
            <h1
              className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl"
              style={{ fontFamily: '"Fraunces", serif' }}
            >
              {t('checkout.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {t('checkout.description')}
            </p>

            <div className="mt-4 inline-flex rounded-full border border-white/80 bg-[#f0fdfa] p-1 shadow-sm ">
              <button
                type="button"
                onClick={() => updateSelection(selectedPlan.id, 'monthly')}
                className={`rounded-full px-4 py-2 text-sm font-medium ${billingCycle === 'monthly'
                  ? 'bg-[#0d9488] text-white'
                  : 'text-slate-600'
                  }`}
              >
                {t('checkout.billing.monthly')}
              </button>
              <button
                type="button"
                onClick={() => updateSelection(selectedPlan.id, 'yearly')}
                className={`rounded-full px-4 py-2 text-sm font-medium ${billingCycle === 'yearly'
                  ? 'bg-[#0d9488] text-white'
                  : 'text-slate-600'
                  }`}
              >
                {t('checkout.billing.yearly')}
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {planIds.map((planId) => {
                const plan = getMarketingPlan(planId)
                const active = plan.id === selectedPlan.id

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => updateSelection(plan.id)}
                    className={`rounded-[26px] border p-5 text-left transition-all ${active
                      ? 'border-[#5eead4] bg-[#f0fdfa] shadow-sm'
                      : 'border-[#e2e8f0] bg-[#ffffff] hover:border-[#99f6e4]'
                      }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t(`pricing.plans.${plan.id}.name`)}
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">
                      {formatMarketingCurrency(
                        billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
                        i18n.language,
                      )}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {t('pricing.planCard.includedBranches')}: {plan.includedBranches}
                    </p>
                  </button>
                )
              })}
            </div>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('checkout.form.companyName.label')}
                  </label>
                  <div className="relative">
                    <Building2Icon
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={formValues.companyName}
                      onChange={(event) => updateField('companyName', event.target.value)}
                      className="h-12 w-full rounded-2xl border border-[#e2e8f0] bg-white pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#ccfbf1]"
                      placeholder={t('checkout.form.companyName.placeholder')}
                    />
                  </div>
                  {errors.companyName && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('checkout.form.name.label')}
                  </label>
                  <div className="relative">
                    <User2Icon
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={formValues.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      className="h-12 w-full rounded-2xl border border-[#e2e8f0] bg-white pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#ccfbf1]"
                      placeholder={t('checkout.form.name.placeholder')}
                    />
                  </div>
                  {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('checkout.form.email.label')}
                  </label>
                  <div className="relative">
                    <MailIcon
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={formValues.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      className="h-12 w-full rounded-2xl border border-[#e2e8f0] bg-white pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#ccfbf1]"
                      placeholder={t('checkout.form.email.placeholder')}
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('checkout.form.username.label')}
                  </label>
                  <input
                    value={formValues.username}
                    onChange={(event) => updateField('username', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[#e2e8f0] bg-white px-4 text-slate-800 shadow-sm outline-none transition focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#ccfbf1]"
                    placeholder={t('checkout.form.username.placeholder')}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('checkout.form.password.label')}
                  </label>
                  <div className="relative">
                    <LockIcon
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="password"
                      value={formValues.password}
                      onChange={(event) => updateField('password', event.target.value)}
                      className="h-12 w-full rounded-2xl border border-[#e2e8f0] bg-white pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#ccfbf1]"
                      placeholder={t('checkout.form.password.placeholder')}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('checkout.form.branchName.label')}
                  </label>
                  <input
                    value={formValues.initialBranchName}
                    onChange={(event) => updateField('initialBranchName', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[#e2e8f0] bg-white px-4 text-slate-800 shadow-sm outline-none transition focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#ccfbf1]"
                    placeholder={t('checkout.form.branchName.placeholder')}
                  />
                  {errors.initialBranchName && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.initialBranchName}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t('checkout.form.branchAddress.label')}
                  </label>
                  <div className="relative">
                    <MapPinIcon
                      size={18}
                      className="pointer-events-none absolute left-4 top-4 text-slate-400"
                    />
                    <textarea
                      value={formValues.initialBranchAddress}
                      onChange={(event) => updateField('initialBranchAddress', event.target.value)}
                      className="min-h-28 w-full rounded-2xl border border-[#e2e8f0] bg-white pl-11 pr-4 pt-3 text-slate-800 shadow-sm outline-none transition focus:border-[#2dd4bf] focus:ring-4 focus:ring-[#ccfbf1]"
                      placeholder={t('checkout.form.branchAddress.placeholder')}
                    />
                  </div>
                  {errors.initialBranchAddress && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.initialBranchAddress}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-[52px] w-full rounded-2xl bg-[#0d9488] text-base font-semibold text-white hover:bg-[#0f766e]"
              >
                {isSubmitting ? t('checkout.submitting') : t('checkout.submit')}
              </Button>
            </form>
          </section>

          <aside className="space-y-6 lg:pt-6">
            <div className="rounded-[36px] border border-white/80 bg-white/90 p-7 shadow-[0_18px_70px_rgba(105,123,144,0.12)] lg:sticky lg:top-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t('checkout.selectedPlan')}
                  </p>
                  <h2
                    className="mt-3 text-3xl font-semibold text-slate-900"
                    style={{ fontFamily: '"Fraunces", serif' }}
                  >
                    {selectedPlanName}
                  </h2>
                </div>
                <div className="rounded-2xl border border-[#c7d2fe] bg-[#eef2ff] px-4 py-2 text-sm font-medium text-slate-700">
                  {t('checkout.mode.public')}
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-[#f1f5f9] bg-[#f8fafc] p-5">
                <div className="flex items-end gap-2">
                  <span
                    className="text-4xl font-semibold text-slate-900"
                    style={{ fontFamily: '"Fraunces", serif' }}
                  >
                    {formatMarketingCurrency(displayedPrice, i18n.language)}
                  </span>
                  <span className="pb-1 text-sm text-slate-500">
                    {t(
                      billingCycle === 'yearly'
                        ? 'checkout.billing.year'
                        : 'checkout.billing.month'
                    )}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {selectedPlanDescription}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {selectedPlanFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3 rounded-2xl border border-[#f1f5f9] bg-[#ffffff] px-4 py-3"
                  >
                    <CheckCircle2Icon size={18} className="mt-0.5 shrink-0 text-[#14b8a6]" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[28px] border border-[#ccfbf1] bg-white p-5">
                <div className="flex items-center gap-3">
                  <CreditCardIcon size={18} className="text-slate-500" />
                  <p className="text-sm font-semibold text-slate-800">
                    {t('checkout.paymentStatus.title')}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t('checkout.paymentStatus.description')}
                </p>
              </div>

              <div className="mt-6 rounded-[28px] border border-[#ccfbf1] bg-[#f0fdfa] p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon size={18} className="text-slate-500" />
                  <p className="text-sm font-semibold text-slate-800">
                    {t('checkout.next.title')}
                  </p>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <li>{t('checkout.next.one')}</li>
                  <li>{t('checkout.next.two')}</li>
                  <li>{t('checkout.next.three')}</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default LandingCheckout
