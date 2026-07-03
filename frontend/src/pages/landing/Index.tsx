import React, { useState } from 'react'
import {
  ArrowRightIcon,
  BarChart3Icon,
  Building2Icon,
  CheckCircle2Icon,
  ClipboardListIcon,
  CpuIcon,
  FilesIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SparklesIcon,
  Users2Icon,
  WrenchIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { LanguajeSwitch } from '@/components/ui/LanguajeSwitcher'
import { NavLink } from '@/components/NavLink'
import { SectionHeading } from '@/components/landing/SectionHeading'
import { PlanCard } from '@/components/landing/PlanCard'
import { Reveal } from '@/components/landing/Reveal'
import { MARKETING_PLANS, type MarketingBillingCycle } from '@/lib/marketing'

const valueCardConfigs = [
  { key: 'updates', icon: FilesIcon, tile: 'bg-teal-100 text-teal-600', ring: 'hover:border-teal-200' },
  { key: 'branches', icon: Building2Icon, tile: 'bg-indigo-100 text-indigo-600', ring: 'hover:border-indigo-200' },
  { key: 'desk', icon: ClipboardListIcon, tile: 'bg-amber-100 text-amber-600', ring: 'hover:border-amber-200' },
] as const

const featureCardConfigs: ReadonlyArray<{
  key: 'branchCatalogs' | 'repairTracking' | 'roles' | 'dashboards'
  icon: typeof MapPinIcon
  className?: string
  tile: string
  ring: string
}> = [
  { key: 'branchCatalogs', icon: MapPinIcon, className: 'lg:col-span-2', tile: 'bg-teal-100 text-teal-600', ring: 'hover:border-teal-200' },
  { key: 'repairTracking', icon: SmartphoneIcon, tile: 'bg-sky-100 text-sky-600', ring: 'hover:border-sky-200' },
  { key: 'roles', icon: ShieldCheckIcon, tile: 'bg-violet-100 text-violet-600', ring: 'hover:border-violet-200' },
  { key: 'dashboards', icon: GaugeIcon, className: 'lg:col-span-2', tile: 'bg-amber-100 text-amber-600', ring: 'hover:border-amber-200' },
]

const workflowStepConfigs = [
  { key: 'receive', icon: ClipboardListIcon, tile: 'bg-teal-100 text-teal-600' },
  { key: 'assign', icon: Users2Icon, tile: 'bg-sky-100 text-sky-600' },
  { key: 'repair', icon: WrenchIcon, tile: 'bg-violet-100 text-violet-600' },
  { key: 'deliver', icon: CheckCircle2Icon, tile: 'bg-amber-100 text-amber-600' },
] as const

const queueItems = [
  { code: 'SR-1824', device: 'iPhone 14 Pro', statusKey: 'statusDiagnosis', pill: 'bg-indigo-50 text-indigo-700' },
  { code: 'SR-1825', device: 'Dell XPS 13', statusKey: 'statusBoardRepair', pill: 'bg-amber-50 text-amber-700' },
  { code: 'SR-1826', device: 'PlayStation 5', statusKey: 'statusReady', pill: 'bg-emerald-50 text-emerald-700' },
] as const

const branchPerformance = [
  { name: 'Monterrey Centro', value: 84, bar: 'bg-teal-400' },
  { name: 'San Pedro', value: 61, bar: 'bg-indigo-400' },
  { name: 'Apodaca', value: 47, bar: 'bg-violet-400' },
] as const

const PRIMARY_BTN = 'bg-teal-600 text-white shadow-sm transition hover:bg-teal-700'

export const LandingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<MarketingBillingCycle>('monthly')
  const { t } = useTranslation('landing')

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f6f2] text-slate-900">
      {/* Acentos pastel de fondo (color plano y difuminado, sin degradados) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="animate-blob absolute -top-24 -left-24 h-[26rem] w-[26rem] rounded-full bg-teal-200/40 blur-3xl" />
        <div className="animate-blob absolute top-[10%] right-[-6%] h-[24rem] w-[24rem] rounded-full bg-indigo-200/40 blur-3xl [animation-delay:-7s]" />
        <div className="animate-blob absolute bottom-[-10%] left-[22%] h-[22rem] w-[22rem] rounded-full bg-amber-100/50 blur-3xl [animation-delay:-13s]" />
      </div>

      <div className="relative">
        <header className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:flex-nowrap lg:px-10 lg:py-8">
          <Link to="/landing" className="group flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white transition group-hover:scale-105">
              <CpuIcon size={22} aria-hidden="true" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-slate-700">Garfix</p>
          </Link>

          <nav className="hidden items-center gap-7 rounded-full border border-slate-200/80 bg-white/80 px-7 py-3 shadow-sm backdrop-blur lg:flex">
            <NavLink href="#features">{t('nav.features')}</NavLink>
            <NavLink href="#workflow">{t('nav.workflow')}</NavLink>
            <NavLink href="#pricing">{t('nav.pricing')}</NavLink>
          </nav>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <LanguajeSwitch />
            <Button
              asChild
              variant="ghost"
              className="rounded-full px-4 text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
            >
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
            <Button asChild className={`rounded-full px-5 ${PRIMARY_BTN}`}>
              <Link to="/checkout?plan=PRO&cycle=monthly">{t('nav.startDemo')}</Link>
            </Button>
          </div>
        </header>

        <main>
          {/* HERO */}
          <section className="mx-auto grid w-full max-w-[1440px] items-center gap-16 px-4 pb-32 pt-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20 lg:px-10 lg:pb-36 lg:pt-16 xl:gap-24">
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
                <SparklesIcon size={13} className="text-teal-500" aria-hidden="true" />
                {t('hero.eyebrow')}
              </span>

              <h1
                className="mt-8 max-w-3xl text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-[4.35rem] lg:leading-[1.02]"
                style={{ fontFamily: '"Fraunces", serif' }}
              >
                {t('hero.title')}
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600">
                {t('hero.description')}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className={`h-[54px] rounded-full px-7 text-base ${PRIMARY_BTN}`}>
                  <Link to="/checkout?plan=PRO&cycle=monthly">
                    {t('hero.primaryCta')}
                    <ArrowRightIcon size={18} aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-[54px] rounded-full border-slate-200 bg-white px-7 text-base text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                >
                  <a href="#features">{t('hero.secondaryCta')}</a>
                </Button>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="animate-float-slow relative overflow-hidden rounded-[40px] border border-slate-200/80 bg-white p-6 shadow-[0_28px_90px_rgba(100,116,139,0.16)] sm:p-8 lg:p-9">
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-teal-100/70 blur-2xl" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-5 rounded-[28px] border border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        {t('hero.dashboard.eyebrow')}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {t('hero.dashboard.title')}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
                      <LayoutDashboardIcon size={18} aria-hidden="true" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[26px] border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/80">
                        {t('hero.dashboard.stats.active.label')}
                      </p>
                      <p className="mt-4 text-3xl font-bold text-emerald-600">68</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {t('hero.dashboard.stats.active.description')}
                      </p>
                    </div>
                    <div className="rounded-[26px] border border-indigo-100 bg-indigo-50 p-5 sm:p-6">
                      <p className="text-xs uppercase tracking-[0.2em] text-indigo-700/80">
                        {t('hero.dashboard.stats.branches.label')}
                      </p>
                      <p className="mt-4 text-3xl font-bold text-indigo-600">3</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {t('hero.dashboard.stats.branches.description')}
                      </p>
                    </div>
                    <div className="rounded-[26px] border border-amber-100 bg-amber-50 p-5 sm:p-6">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-700/80">
                        {t('hero.dashboard.stats.delivery.label')}
                      </p>
                      <p className="mt-4 text-3xl font-bold text-amber-600">24h</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {t('hero.dashboard.stats.delivery.description')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
                    <div className="rounded-[30px] border border-slate-100 bg-white p-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {t('hero.dashboard.queue.title')}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t('hero.dashboard.queue.subtitle')}
                          </p>
                        </div>
                        <BarChart3Icon size={18} className="text-indigo-500" aria-hidden="true" />
                      </div>

                      <div className="mt-5 space-y-3">
                        {queueItems.map((item) => (
                          <div
                            key={item.code}
                            className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3.5"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{item.code}</p>
                              <p className="text-sm text-slate-600">{item.device}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.pill}`}>
                              {t(`hero.dashboard.queue.${item.statusKey}`)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-[30px] border border-slate-100 bg-white p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">
                            {t('hero.dashboard.branchPulse.title')}
                          </p>
                          <Building2Icon size={18} className="text-teal-500" aria-hidden="true" />
                        </div>
                        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-[72%] rounded-full bg-teal-400" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>{t('hero.dashboard.branchPulse.branch')}</span>
                          <span>{t('hero.dashboard.branchPulse.load')}</span>
                        </div>
                      </div>

                      <div className="rounded-[30px] border border-teal-100 bg-teal-50 p-5 sm:p-6">
                        <div className="flex items-center gap-3">
                          <ShieldCheckIcon size={18} className="text-teal-600" aria-hidden="true" />
                          <p className="text-sm font-semibold text-slate-800">
                            {t('hero.dashboard.scope.title')}
                          </p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {t('hero.dashboard.scope.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* VALUE */}
          <section className="mx-auto w-full max-w-[1440px] px-4 pb-28 sm:px-6 lg:px-10">
            <div className="grid gap-7 lg:grid-cols-3">
              {valueCardConfigs.map((card, index) => (
                <Reveal
                  key={card.key}
                  as="article"
                  delay={index * 90}
                  className={`group rounded-[30px] border border-slate-200/70 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg sm:p-9 ${card.ring}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.tile} transition group-hover:scale-110`}>
                    <card.icon size={21} aria-hidden="true" />
                  </div>
                  <p className="mt-7 text-xl font-semibold text-slate-900">
                    {t(`value.cards.${card.key}.title`)}
                  </p>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">
                    {t(`value.cards.${card.key}.description`)}
                  </p>
                </Reveal>
              ))}
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="mx-auto w-full max-w-[1440px] px-4 py-28 sm:px-6 lg:px-10">
            <Reveal>
              <SectionHeading
                eyebrow={t('features.eyebrow')}
                title={t('features.title')}
                description={t('features.description')}
                align="center"
              />
            </Reveal>

            <div className="mt-16 grid gap-7 lg:grid-cols-3">
              {featureCardConfigs.map((feature, index) => (
                <Reveal
                  key={feature.key}
                  as="article"
                  delay={index * 80}
                  className={`group rounded-[34px] border border-slate-200/70 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg sm:p-9 ${feature.ring} ${feature.className || ''}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tile} transition group-hover:scale-110`}>
                    <feature.icon size={22} aria-hidden="true" />
                  </div>
                  <p className="mt-8 text-2xl font-semibold text-slate-900">
                    {t(`features.cards.${feature.key}.title`)}
                  </p>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                    {t(`features.cards.${feature.key}.description`)}
                  </p>
                </Reveal>
              ))}
            </div>
          </section>

          {/* WORKFLOW */}
          <section id="workflow" className="mx-auto w-full max-w-[1440px] px-4 py-28 sm:px-6 lg:px-10">
            <div className="relative overflow-hidden rounded-[42px] border border-teal-100 bg-teal-50/60 px-6 py-12 sm:px-12 sm:py-16">
              <Reveal>
                <SectionHeading
                  eyebrow={t('workflow.eyebrow')}
                  title={t('workflow.title')}
                  description={t('workflow.description')}
                  align="center"
                />
              </Reveal>

              <div className="relative mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="pointer-events-none absolute left-0 right-0 top-[2.1rem] hidden h-0.5 bg-teal-200 xl:block" aria-hidden="true" />
                {workflowStepConfigs.map((step, index) => (
                  <Reveal
                    key={step.key}
                    as="article"
                    delay={index * 110}
                    className="group relative rounded-[30px] border border-slate-200/70 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${step.tile} transition group-hover:scale-110`}>
                        <step.icon size={18} aria-hidden="true" />
                      </div>
                      <span
                        className="text-2xl font-bold tracking-tight text-slate-300"
                        style={{ fontFamily: '"Fraunces", serif' }}
                      >
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-7 text-xl font-semibold text-slate-900">
                      {t(`workflow.steps.${step.key}.title`)}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {t(`workflow.steps.${step.key}.description`)}
                    </p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* BRANCHES */}
          <section className="mx-auto w-full max-w-[1440px] px-4 py-28 sm:px-6 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <Reveal as="div" className="rounded-[38px] border border-slate-200/70 bg-white p-8 shadow-sm sm:p-12">
                <SectionHeading
                  eyebrow={t('branches.eyebrow')}
                  title={t('branches.title')}
                  description={t('branches.description')}
                />

                <ul className="mt-10 space-y-4">
                  {(['customers', 'technicians', 'realtime'] as const).map((itemKey) => (
                    <li
                      key={itemKey}
                      className="flex items-start gap-3 rounded-2xl bg-teal-50 px-4 py-4 transition hover:bg-teal-100/60"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
                        <CheckCircle2Icon size={14} aria-hidden="true" />
                      </span>
                      <span className="text-sm text-slate-700">{t(`branches.items.${itemKey}`)}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal as="div" delay={120} className="rounded-[38px] border border-indigo-100 bg-indigo-50 p-8 shadow-sm sm:p-12">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">
                      {t('branches.snapshot.eyebrow')}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {t('branches.snapshot.title')}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <GaugeIcon size={18} aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[26px] border border-emerald-100 bg-white p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600/80">
                      {t('branches.snapshot.collected.label')}
                    </p>
                    <p className="mt-4 text-4xl font-bold text-emerald-600">$18.4k</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {t('branches.snapshot.collected.description')}
                    </p>
                  </div>
                  <div className="rounded-[26px] border border-indigo-100 bg-white p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-600/80">
                      {t('branches.snapshot.load.label')}
                    </p>
                    <p className="mt-4 text-4xl font-bold text-indigo-600">72%</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {t('branches.snapshot.load.description')}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[28px] border border-slate-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      {t('branches.snapshot.performance.title')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('branches.snapshot.performance.period')}
                    </p>
                  </div>
                  <div className="mt-5 space-y-4">
                    {branchPerformance.map((branch) => (
                      <div key={branch.name}>
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>{branch.name}</span>
                          <span className="font-semibold text-slate-800">{branch.value}%</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`bar-grow h-full rounded-full ${branch.bar}`}
                            style={{ width: `${branch.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* PRICING */}
          <section id="pricing" className="mx-auto w-full max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <Reveal>
                <SectionHeading
                  eyebrow={t('pricing.eyebrow')}
                  title={t('pricing.title')}
                  description={t('pricing.description')}
                />
              </Reveal>

              <div className="inline-flex rounded-full border border-slate-200/80 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  aria-pressed={billingCycle === 'monthly'}
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('pricing.billing.monthly')}
                </button>
                <button
                  type="button"
                  aria-pressed={billingCycle === 'yearly'}
                  onClick={() => setBillingCycle('yearly')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('pricing.billing.yearly')}
                </button>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-500">{t('pricing.currencyNote')}</p>

            <div className="mt-16 grid items-stretch gap-7 xl:grid-cols-3">
              {MARKETING_PLANS.map((plan, index) => (
                <Reveal key={plan.id} delay={index * 90} className="h-full">
                  <PlanCard plan={plan} billingCycle={billingCycle} />
                </Reveal>
              ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="mx-auto w-full max-w-[1440px] px-4 pb-32 pt-8 sm:px-6 lg:px-10">
            <Reveal className="relative overflow-hidden rounded-[42px] bg-teal-600 px-8 py-14 text-white shadow-[0_24px_70px_rgba(13,148,136,0.28)] sm:px-14 sm:py-18">
              <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-teal-400/30 blur-2xl" aria-hidden="true" />
              <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                    {t('finalCta.eyebrow')}
                  </p>
                  <h2
                    className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl"
                    style={{ fontFamily: '"Fraunces", serif' }}
                  >
                    {t('finalCta.title')}
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 sm:text-lg">
                    {t('finalCta.description')}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full bg-white px-6 text-base font-semibold text-teal-700 shadow-sm transition hover:scale-[1.03] hover:bg-white"
                  >
                    <Link to="/checkout?plan=PRO&cycle=monthly">{t('finalCta.primary')}</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-base text-white transition hover:bg-white/20"
                  >
                    <a href="#pricing">{t('finalCta.secondary')}</a>
                  </Button>
                </div>
              </div>
            </Reveal>
          </section>
        </main>

        <footer className="relative border-t border-slate-200/70 bg-white/70 backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-teal-300" aria-hidden="true" />
          <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white">
                    <CpuIcon size={20} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.28em] text-slate-700">Garfix</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{t('footer.tagline')}</p>
              </div>
              <nav
                aria-label="Enlaces del pie de página"
                className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600"
              >
                <a className="transition hover:text-teal-700" href="#features">{t('nav.features')}</a>
                <a className="transition hover:text-teal-700" href="#workflow">{t('nav.workflow')}</a>
                <a className="transition hover:text-teal-700" href="#pricing">{t('nav.pricing')}</a>
                <Link className="transition hover:text-teal-700" to="/login">{t('nav.login')}</Link>
              </nav>
            </div>
            <p className="mt-8 border-t border-slate-200/70 pt-6 text-xs text-slate-500">
              © {new Date().getFullYear()} Garfix. {t('footer.rights')}
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage
