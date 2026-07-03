import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRightIcon,
  Building2Icon,
  CircleDollarSignIcon,
  RefreshCwIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { getSuperAdminOverview, type SuperAdminOverview } from '@/services/admin/admin.api'

const emptyOverview: SuperAdminOverview = {
  summary: {
    clients: 0,
    activeClients: 0,
    inactiveClients: 0,
    totalBranchLimit: 0,
    usedBranches: 0,
    availableBranches: 0,
    totalSubscriptionPrice: 0,
    totalServiceQuoted: 0,
    totalServiceCollected: 0,
    totalServicePending: 0,
    totalServiceRequests: 0,
    totalServices: 0,
    estimatedIncome: 0,
  },
  plans: [],
  topClientsByRevenue: [],
  users: [],
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value || 0)

export const SuperAdminDashboard = () => {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<SuperAdminOverview>(emptyOverview)
  const [isLoading, setIsLoading] = useState(true)

  const loadOverview = async () => {
    setIsLoading(true)
    try {
      const data = await getSuperAdminOverview()
      setOverview(data)
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible cargar el dashboard'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOverview()
  }, [])

  const estimatedMrr = useMemo(
    () => overview.summary.totalSubscriptionPrice + overview.summary.totalServiceCollected,
    [overview.summary.totalServiceCollected, overview.summary.totalSubscriptionPrice],
  )

  return (
    <div className="space-y-6">
      <Toaster />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Global</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Métricas generales, ingresos y operación de todos tus clientes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadOverview()} disabled={isLoading}>
            <RefreshCwIcon size={16} className={isLoading ? 'animate-spin' : ''} />
            Recargar
          </Button>
          <Button variant="outline" onClick={() => navigate('/superadmin/clients')}>
            Ver clientes
          </Button>
          <Button variant="default" onClick={() => navigate('/superadmin/new-client')}>
            Nuevo cliente
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Clientes</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {overview.summary.clients}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {overview.summary.activeClients} activos · {overview.summary.inactiveClients} inactivos
              </p>
            </div>
            <span className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
              <Building2Icon size={18} />
            </span>
          </div>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Ingreso por planes</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(overview.summary.totalSubscriptionPrice)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Mensual estimado</p>
            </div>
            <span className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
              <WalletIcon size={18} />
            </span>
          </div>
        </Card>

        <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 dark:border-violet-900/40 dark:from-violet-950/30 dark:to-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Ingreso total estimado</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(overview.summary.estimatedIncome)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Planes + servicios cobrados ({formatCurrency(estimatedMrr)})
              </p>
            </div>
            <span className="rounded-full bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
              <CircleDollarSignIcon size={18} />
            </span>
          </div>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Sucursales</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {overview.summary.usedBranches} / {overview.summary.totalBranchLimit}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Disponibles: {overview.summary.availableBranches}
              </p>
            </div>
            <span className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300">
              <UsersIcon size={18} />
            </span>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Planes de clientes</h2>
            <span className="text-xs text-gray-500">{overview.plans.length} planes</span>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                  <th className="px-2 py-2">Plan</th>
                  <th className="px-2 py-2">Clientes</th>
                  <th className="px-2 py-2">Sucursales</th>
                  <th className="px-2 py-2">Ingreso mensual</th>
                </tr>
              </thead>
              <tbody>
                {overview.plans.map((plan) => (
                  <tr key={plan.plan} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-2 py-2 font-medium text-gray-900 dark:text-gray-100">{plan.plan}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{plan.clients}</td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                      {plan.usedBranches} / {plan.totalBranchLimit}
                    </td>
                    <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                      {formatCurrency(plan.monthlyPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {overview.plans.length === 0 && (
              <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
                Aún no hay planes registrados para mostrar.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Clientes con mayor ingreso
            </h2>
            <Button
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => navigate('/superadmin/clients')}
            >
              Gestionar
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {overview.topClientsByRevenue.map((client) => (
              <div
                key={client.companyId}
                className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{client.companyName}</p>
                    <p className="text-xs text-gray-500">{client.subscriptionPlan}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                    {formatCurrency(client.totalIncome)}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-500 sm:grid-cols-3">
                  <span>Plan: {formatCurrency(client.monthlyPrice)}</span>
                  <span>Cobrado: {formatCurrency(client.serviceCollected)}</span>
                  <span>Cotizado: {formatCurrency(client.serviceQuoted)}</span>
                </div>
              </div>
            ))}

            {overview.topClientsByRevenue.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Sin datos de ingresos todavía.
              </p>
            )}
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Usuarios administradores por cliente
          </h2>
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => navigate('/superadmin/clients')}>
            Ver detalle
            <ArrowUpRightIcon size={14} />
          </Button>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                <th className="px-2 py-2">Usuario</th>
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Plan</th>
                <th className="px-2 py-2">Sucursales</th>
                <th className="px-2 py-2">Ingreso plan</th>
              </tr>
            </thead>
            <tbody>
              {overview.users.map((userRow) => (
                <tr key={userRow.userId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-2 py-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{userRow.name}</p>
                    <p className="text-xs text-gray-500">{userRow.email || 'Sin correo'}</p>
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{userRow.companyName}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{userRow.subscriptionPlan}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {userRow.usedBranches} / {userRow.branchLimit}
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {formatCurrency(userRow.monthlyPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {overview.users.length === 0 && (
            <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
              Aún no hay administradores creados.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
