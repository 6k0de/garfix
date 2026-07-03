import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  Loader2Icon,
  RefreshCwIcon,
  XCircleIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LanguajeSwitch } from '@/components/ui/LanguajeSwitcher'
import {
  getSignupPaymentStatus,
  type SignupPaymentStatusResponse,
} from '@/services/auth/auth.api'
import { setAuthSession } from '@/lib/auth'
import { clearPendingSignup } from '@/lib/pendingSignup'
import {
  formatMarketingCurrency,
  type MarketingBillingCycle,
  type MarketingPlanId,
} from '@/lib/marketing'

const SUCCESS_REDIRECT_MS = 2200
const AUTO_RETRY_SECONDS = 6
const MAX_AUTO_RETRIES = 40

type ViewState = 'checking' | 'success' | 'pending' | 'rejected' | 'error'

interface CheckoutReturnProps {
  signupPaymentId: string
}

const TONE: Record<Exclude<ViewState, 'checking'>, string> = {
  success: 'bg-emerald-100 text-emerald-600',
  pending: 'bg-amber-100 text-amber-600',
  rejected: 'bg-rose-100 text-rose-600',
  error: 'bg-amber-100 text-amber-600',
}

export const CheckoutReturn: React.FC<CheckoutReturnProps> = ({ signupPaymentId }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t, i18n } = useTranslation('landing')

  const [view, setView] = useState<ViewState>('checking')
  const [detail, setDetail] = useState<SignupPaymentStatusResponse | null>(null)
  const [isRechecking, setIsRechecking] = useState(false)
  const [countdown, setCountdown] = useState(AUTO_RETRY_SECONDS)

  const sessionStoredRef = useRef(false)
  const autoRetriesRef = useRef(0)

  const plan = (detail?.plan ??
    (searchParams.get('plan') as MarketingPlanId | null) ??
    'BASIC') as MarketingPlanId
  const cycle: MarketingBillingCycle =
    detail?.billingCycle ?? (searchParams.get('cycle') === 'yearly' ? 'yearly' : 'monthly')
  const planName = t(`pricing.plans.${plan}.name`, { defaultValue: plan })
  const amount = detail?.amount ?? null

  const check = useCallback(
    async (silent = false) => {
      if (silent) {
        setIsRechecking(true)
      } else {
        setView('checking')
      }

      try {
        const response = await getSignupPaymentStatus(signupPaymentId, {
          payment_id: searchParams.get('payment_id'),
          collection_id: searchParams.get('collection_id'),
        })
        setDetail(response)

        if (response.status === 'approved' && response.session) {
          clearPendingSignup()
          if (!sessionStoredRef.current) {
            sessionStoredRef.current = true
            setAuthSession(response.session)
          }
          setView('success')
          return
        }

        if (response.status === 'rejected') {
          clearPendingSignup()
          setView('rejected')
          return
        }

        setCountdown(AUTO_RETRY_SECONDS)
        setView('pending')
      } catch {
        // Un fallo en un reintento silencioso (polling de "pendiente") no debe
        // sacar al usuario de esa pantalla: reprogramamos y seguimos intentando.
        if (silent) {
          setCountdown(AUTO_RETRY_SECONDS)
        } else {
          setView('error')
        }
      } finally {
        if (silent) {
          setIsRechecking(false)
        }
      }
    },
    [searchParams, signupPaymentId],
  )

  // Primera verificación al montar.
  useEffect(() => {
    void check()
  }, [check])

  // Éxito → guarda sesión (ya hecho en check) y redirige al panel.
  useEffect(() => {
    if (view !== 'success') return
    toast.success(t('checkout.return.toastApproved'))
    const timer = setTimeout(() => {
      navigate('/services/list', { replace: true })
    }, SUCCESS_REDIRECT_MS)
    return () => clearTimeout(timer)
  }, [view, navigate, t])

  // Pendiente → reintenta automáticamente con cuenta regresiva.
  useEffect(() => {
    if (view !== 'pending') return

    if (countdown <= 0) {
      if (!isRechecking && autoRetriesRef.current < MAX_AUTO_RETRIES) {
        autoRetriesRef.current += 1
        void check(true)
      }
      return
    }

    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [view, countdown, isRechecking, check])

  const goToForm = () => {
    clearPendingSignup()
    navigate(`/checkout?plan=${plan}&cycle=${cycle}`, { replace: true })
  }

  const goToPanel = () => navigate('/services/list', { replace: true })

  const tone = view === 'checking' ? 'bg-teal-100 text-teal-600' : TONE[view]

  const renderIcon = () => {
    switch (view) {
      case 'success':
        return <CheckCircle2Icon size={30} />
      case 'pending':
        return <ClockIcon size={30} />
      case 'rejected':
        return <XCircleIcon size={30} />
      case 'error':
        return <AlertTriangleIcon size={30} />
      default:
        return <Loader2Icon size={30} className="animate-spin" />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f6f2] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <Toaster />
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
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
        <LanguajeSwitch />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center py-10">
        <section className="w-full rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-[0_18px_70px_rgba(105,123,144,0.12)]">
          <span
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${tone}`}
          >
            {renderIcon()}
          </span>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {t(`checkout.return.${view}.badge`)}
          </p>
          <h1
            className="mt-2 text-2xl font-semibold tracking-tight text-slate-900"
            style={{ fontFamily: '"Fraunces", serif' }}
          >
            {t(`checkout.return.${view}.title`)}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
            {t(`checkout.return.${view}.description`)}
          </p>

          {/* Resumen del plan (cuando ya tenemos datos) */}
          {view !== 'checking' && (
            <div className="mt-6 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{t('checkout.return.summary.plan')}</span>
                <span className="font-semibold text-slate-800">{planName}</span>
              </div>
              {amount !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{t('checkout.return.summary.amount')}</span>
                  <span className="font-semibold text-slate-800">
                    {formatMarketingCurrency(amount, i18n.language)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Éxito: iniciando sesión */}
          {view === 'success' && (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
              <Loader2Icon size={16} className="animate-spin" />
              {t('checkout.return.success.signingIn')}
            </div>
          )}

          {/* Pendiente: cuenta regresiva de reintento */}
          {view === 'pending' && (
            <p className="mt-5 text-xs text-slate-400">
              {isRechecking
                ? t('checkout.return.pending.checking')
                : t('checkout.return.pending.autoRetry', { seconds: countdown })}
            </p>
          )}

          {/* Acciones por estado */}
          <div className="mt-7 space-y-3">
            {view === 'success' && (
              <Button
                onClick={goToPanel}
                size="lg"
                className="h-12 w-full rounded-2xl bg-teal-600 text-base font-semibold text-white hover:bg-teal-700"
              >
                {t('checkout.return.success.cta')}
                <ArrowRightIcon size={18} />
              </Button>
            )}

            {(view === 'pending' || view === 'error') && (
              <Button
                onClick={() => void check(true)}
                disabled={isRechecking}
                size="lg"
                className="h-12 w-full rounded-2xl bg-teal-600 text-base font-semibold text-white hover:bg-teal-700"
              >
                <RefreshCwIcon size={18} className={isRechecking ? 'animate-spin' : ''} />
                {t(`checkout.return.${view}.${view === 'pending' ? 'checkNow' : 'retry'}`)}
              </Button>
            )}

            {view === 'rejected' && (
              <Button
                onClick={goToForm}
                size="lg"
                className="h-12 w-full rounded-2xl bg-teal-600 text-base font-semibold text-white hover:bg-teal-700"
              >
                <RefreshCwIcon size={18} />
                {t('checkout.return.rejected.retry')}
              </Button>
            )}

            {/* Salida para no quedar atrapado en pendiente/error: nuevo intento de pago. */}
            {(view === 'pending' || view === 'error') && (
              <Button
                onClick={goToForm}
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-2xl border-slate-200 text-base font-medium text-slate-600 hover:border-teal-300 hover:bg-white hover:text-teal-700"
              >
                <CreditCardIcon size={18} />
                {t('checkout.return.payAgain')}
              </Button>
            )}

            {view !== 'checking' && view !== 'success' && (
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-11 w-full rounded-2xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-teal-700"
              >
                <Link to="/landing">{t(`checkout.return.${view}.backHome`)}</Link>
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default CheckoutReturn
