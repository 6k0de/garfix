import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRightIcon,
  ClipboardListIcon,
  PlusIcon,
  RefreshCwIcon,
  SmartphoneIcon,
  WalletIcon,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getApiErrorMessage } from '@/lib/apiError'
import { getAuthUser } from '@/lib/auth'
import { useActiveBranchId } from '@/lib/useActiveBranchId'
import { getStatusTagStyle, normalizeHexColor } from '@/lib/color'
import {
  getCompanyOverview,
  type CompanyOverview,
} from '@/services/service/service.api'

const emptyOverview: CompanyOverview = {
  branch: null,
  summary: {
    totalRequests: 0,
    totalDevices: 0,
    totalQuoted: 0,
    totalCollected: 0,
    totalPending: 0,
    clientsCount: 0,
    requestsThisMonth: 0,
    collectedThisMonth: 0,
    quotedThisMonth: 0,
  },
  statusBreakdown: [],
  recentRequests: [],
  topTechnicians: [],
  monthlyTrend: [],
}

interface KpiCardProps {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
  tone: string
}

const CARD_BASE = 'border-slate-200/70 dark:border-slate-700'

const HomeSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6" aria-hidden="true">
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className={`gap-0 p-5 ${CARD_BASE}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="w-full space-y-3">
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-700" />
              <div className="h-7 w-20 rounded bg-slate-200 dark:bg-slate-600" />
              <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-700" />
            </div>
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-700" />
          </div>
        </Card>
      ))}
    </section>

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card
          key={index}
          className={`flex-row items-center justify-between gap-3 p-4 ${CARD_BASE}`}
        >
          <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-600" />
        </Card>
      ))}
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className={`gap-4 p-5 ${CARD_BASE}`}>
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-600" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((__, row) => (
              <div key={row} className="h-9 w-full rounded-lg bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        </Card>
      ))}
    </section>
  </div>
)

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, tone }) => (
  <Card className={`gap-0 p-5 ${CARD_BASE}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-2 truncate text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
      <span className={`shrink-0 rounded-2xl p-2.5 ${tone}`}>{icon}</span>
    </div>
  </Card>
)

export const Home: React.FC = () => {
  const { t, i18n } = useTranslation(['home', 'list-service'])
  const navigate = useNavigate()
  const activeBranchId = useActiveBranchId()
  const user = getAuthUser()
  const [overview, setOverview] = useState<CompanyOverview>(emptyOverview)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value || 0),
    [i18n.language],
  )

  const formatDate = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'es-MX', {
        day: '2-digit',
        month: 'short',
      }).format(new Date(value)),
    [i18n.language],
  )

  // Etiqueta de mes localizada a partir de la clave "YYYY-MM".
  const formatMonth = useCallback(
    (monthKey: string) => {
      const [year, month] = monthKey.split('-').map(Number)
      if (!year || !month) return monthKey
      return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'es-MX', {
        month: 'short',
      }).format(new Date(year, month - 1, 1))
    },
    [i18n.language],
  )

  const loadOverview = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCompanyOverview()
      setOverview(data)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('home:loadError')))
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }, [t])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview, activeBranchId])

  const { summary } = overview
  // El skeleton solo aparece en la primera carga; en refrescos posteriores se
  // mantiene el contenido actual para evitar parpadeos entre estados.
  const showSkeleton = isLoading && !hasLoaded
  const isEmpty = hasLoaded && summary.totalRequests === 0

  const averageTicket = useMemo(
    () => (summary.totalRequests > 0 ? summary.totalQuoted / summary.totalRequests : 0),
    [summary.totalQuoted, summary.totalRequests],
  )

  const maxStatusCount = useMemo(
    () => overview.statusBreakdown.reduce((max, item) => Math.max(max, item.count), 0),
    [overview.statusBreakdown],
  )

  const maxTrendCount = useMemo(
    () => overview.monthlyTrend.reduce((max, item) => Math.max(max, item.count), 0),
    [overview.monthlyTrend],
  )

  const greeting = user?.name
    ? t('home:greeting', { name: user.name.split(' ')[0] })
    : t('home:greetingFallback')

  const subtitle = overview.branch
    ? t('home:subtitle', { branch: overview.branch.name })
    : t('home:subtitleNoBranch')

  return (
    <div className="space-y-6">
      <Toaster />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{greeting} 👋</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void loadOverview()}
            disabled={isLoading}
            className="border-slate-200 dark:border-slate-700"
          >
            <RefreshCwIcon size={16} className={isLoading ? 'animate-spin' : ''} />
            {t('home:refresh')}
          </Button>
          <Button
            onClick={() => navigate('/services/create')}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            <PlusIcon size={16} />
            {t('home:newService')}
          </Button>
        </div>
      </header>

      {showSkeleton ? (
        <HomeSkeleton />
      ) : isEmpty ? (
        <Card className="items-center gap-3 border-dashed border-slate-300 bg-slate-50/60 py-14 text-center dark:border-slate-600 dark:bg-slate-800/40">
          <span className="rounded-2xl bg-teal-100 p-3 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
            <ClipboardListIcon size={26} />
          </span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('home:emptyState.title')}
          </h2>
          <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
            {t('home:emptyState.description')}
          </p>
          <Button
            onClick={() => navigate('/services/create')}
            className="mt-1 bg-teal-600 text-white hover:bg-teal-700"
          >
            <PlusIcon size={16} />
            {t('home:emptyState.cta')}
          </Button>
        </Card>
      ) : (
        <>
          {/* KPIs principales */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label={t('home:kpis.requests')}
              value={String(summary.totalRequests)}
              hint={t('home:kpis.requestsHint', { count: summary.requestsThisMonth })}
              icon={<ClipboardListIcon size={18} />}
              tone="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300"
            />
            <KpiCard
              label={t('home:kpis.devices')}
              value={String(summary.totalDevices)}
              hint={t('home:kpis.devicesHint')}
              icon={<SmartphoneIcon size={18} />}
              tone="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
            />
            <KpiCard
              label={t('home:kpis.collected')}
              value={formatCurrency(summary.totalCollected)}
              hint={t('home:kpis.collectedHint', {
                amount: formatCurrency(summary.collectedThisMonth),
              })}
              icon={<WalletIcon size={18} />}
              tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
            />
            <KpiCard
              label={t('home:kpis.pending')}
              value={formatCurrency(summary.totalPending)}
              hint={t('home:kpis.pendingHint', {
                quoted: formatCurrency(summary.totalQuoted),
              })}
              icon={<WalletIcon size={18} />}
              tone="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
            />
          </section>

          {/* Métricas secundarias */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className={`flex-row items-center justify-between gap-3 p-4 ${CARD_BASE}`}>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t('home:secondary.quoted')}
              </span>
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(summary.totalQuoted)}
              </span>
            </Card>
            <Card className={`flex-row items-center justify-between gap-3 p-4 ${CARD_BASE}`}>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t('home:secondary.clients')}
              </span>
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {summary.clientsCount}
              </span>
            </Card>
            <Card className={`flex-row items-center justify-between gap-3 p-4 ${CARD_BASE}`}>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t('home:secondary.ticket')}
              </span>
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(averageTicket)}
              </span>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Estado de las órdenes */}
            <Card className={`gap-4 p-5 ${CARD_BASE}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {t('home:status.title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('home:status.subtitle')}
                  </p>
                </div>
              </div>

              {overview.statusBreakdown.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('home:status.empty')}
                </p>
              ) : (
                <ul className="space-y-3">
                  {overview.statusBreakdown.map((item) => {
                    const color = normalizeHexColor(item.colorHex)
                    const width =
                      maxStatusCount > 0 ? Math.max((item.count / maxStatusCount) * 100, 6) : 0
                    return (
                      <li key={item.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {item.name}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.count}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${width}%`, backgroundColor: color }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            {/* Órdenes recientes */}
            <Card className={`gap-4 p-5 ${CARD_BASE}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {t('home:recent.title')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('home:recent.subtitle')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-8 border-slate-200 px-3 text-xs dark:border-slate-700"
                  onClick={() => navigate('/services/list')}
                >
                  {t('home:viewAll')}
                  <ArrowUpRightIcon size={14} />
                </Button>
              </div>

              {overview.recentRequests.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('home:recent.empty')}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {overview.recentRequests.map((request) => (
                    <li key={request.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/services/edit/${request.id}`)}
                        className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:opacity-80"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {request.client}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {request.code} · {request.device}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                            style={getStatusTagStyle(request.statusColor)}
                          >
                            {request.status}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(request.receptionDate)} · {formatCurrency(request.total)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Tendencia mensual */}
            <Card className={`gap-4 p-5 ${CARD_BASE}`}>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t('home:trend.title')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('home:trend.subtitle')}
                </p>
              </div>

              {maxTrendCount === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('home:trend.empty')}
                </p>
              ) : (
                <div className="flex h-40 items-end justify-between gap-2">
                  {overview.monthlyTrend.map((item, index) => {
                    const height =
                      maxTrendCount > 0 ? Math.max((item.count / maxTrendCount) * 100, 4) : 4
                    const isLast = index === overview.monthlyTrend.length - 1
                    return (
                      <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {item.count}
                        </span>
                        <div className="flex h-28 w-full items-end">
                          <div
                            className={`w-full rounded-t-lg transition-all ${
                              isLast ? 'bg-teal-500' : 'bg-teal-200 dark:bg-teal-800'
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
                          {formatMonth(item.month)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Técnicos destacados */}
            <Card className={`gap-4 p-5 ${CARD_BASE}`}>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t('home:technicians.title')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('home:technicians.subtitle')}
                </p>
              </div>

              {overview.topTechnicians.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('home:technicians.empty')}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {overview.topTechnicians.map((tech, index) => (
                    <li
                      key={tech.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                          {index + 1}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {tech.name}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{t('home:technicians.devices', { count: tech.devices })}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(tech.collected)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
