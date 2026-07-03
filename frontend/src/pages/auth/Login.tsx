import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { LoginFormValues } from '@/@types'
import { loginSchema } from '@/schemas/login.schemas'
import axios from 'axios'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  AlertCircleIcon,
  Building2Icon,
  ClipboardListIcon,
  CpuIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogInIcon,
  MailIcon,
  QrCodeIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isSuperAdminUser, setAuthSession } from '@/lib/auth'
import { login as loginRequest } from '@/services/auth/auth.api'

const showcaseChips = [
  { icon: ClipboardListIcon, label: 'Órdenes de servicio', tile: 'bg-teal-100 text-teal-600' },
  { icon: Building2Icon, label: 'Multi-sucursal', tile: 'bg-indigo-100 text-indigo-600' },
  { icon: QrCodeIcon, label: 'Evidencias por QR', tile: 'bg-amber-100 text-amber-600' },
] as const

const inputBaseClass =
  'block h-14 w-full rounded-xl border bg-white pl-12 pr-12 text-base text-slate-800 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-100 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500 dark:focus:ring-teal-500/20'

export const Login: React.FC = () => {
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
    mode: 'onSubmit',
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)
    try {
      const response = await loginRequest(values)
      setAuthSession(response)

      const from = location.state as { from?: string } | null
      const defaultPath = isSuperAdminUser(response.user)
        ? '/superadmin/dashboard'
        : '/services/list'
      navigate(from?.from || defaultPath, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string } | undefined)?.message ??
          'No se pudo iniciar sesión. Verifica tus datos.'
        setServerError(msg)
      } else {
        setServerError('Error inesperado.')
      }
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f6f2] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Acentos pastel planos de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-[-10%] h-[24rem] w-[24rem] rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute -right-16 bottom-[-12%] h-[22rem] w-[22rem] rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 shadow-[0_22px_70px_rgba(100,116,139,0.16)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Showcase de marca (plano y pastel, sin imágenes externas) */}
            <section className="relative hidden min-h-[640px] flex-col justify-between bg-teal-50 p-10 lg:flex dark:bg-slate-800/60">
              <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-teal-100/80 blur-2xl dark:bg-teal-500/10" aria-hidden="true" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-teal-300">
                  <ShieldCheckIcon size={14} aria-hidden="true" />
                  Garfix Workshop
                </span>

                <h2
                  className="mt-10 max-w-md text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 dark:text-white"
                  style={{ fontFamily: '"Fraunces", serif' }}
                >
                  Tu taller, bajo control.
                </h2>
                <p className="mt-4 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">
                  Órdenes, técnicos, sucursales, evidencias por QR y cobros en una sola plataforma.
                </p>

                <div className="mt-9 space-y-3">
                  {showcaseChips.map((chip) => (
                    <div
                      key={chip.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${chip.tile}`}>
                        <chip.icon size={18} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {chip.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white">
                  <CpuIcon size={20} aria-hidden="true" />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-slate-700 dark:text-slate-200">
                  Garfix
                </p>
              </div>
            </section>

            {/* Formulario */}
            <section className="bg-white p-6 sm:p-8 lg:border-l lg:border-slate-200/80 lg:p-10 dark:bg-slate-900 dark:lg:border-slate-700">
              <div className="mb-7 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Iniciar sesión
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Accede con tu correo o usuario para continuar.
                  </p>
                </div>
                <ThemeToggle />
              </div>

              {serverError && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircleIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <p>{serverError}</p>
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                  <label
                    htmlFor="identifier"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Correo o usuario
                  </label>
                  <div className="relative">
                    <MailIcon
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="identifier"
                      {...register('identifier')}
                      placeholder="correo@ejemplo.com o usuario"
                      autoComplete="username"
                      aria-invalid={Boolean(errors.identifier)}
                      className={`${inputBaseClass} ${
                        errors.identifier
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-500 dark:focus:ring-red-500/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {errors.identifier?.message && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                      {errors.identifier.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockIcon
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="password"
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      className={`${inputBaseClass} ${
                        errors.password
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-500 dark:focus:ring-red-500/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                  {errors.password?.message && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <a
                    href="#"
                    className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="default"
                  fullWidth
                  disabled={isSubmitting}
                  icon={<LogInIcon size={18} />}
                  className="h-12 w-full rounded-xl bg-teal-600 text-base font-semibold text-white transition hover:bg-teal-700"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Iniciando sesión...
                    </span>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>

              <div className="mt-6 flex flex-col gap-3">
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  El alta de nuevas cuentas la realiza el perfil superadmin desde su panel de administración.
                </p>
                <Link
                  to="/landing"
                  className="text-center text-sm font-medium text-slate-500 transition hover:text-teal-700"
                >
                  ← Volver al inicio
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
