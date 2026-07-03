import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  addCompanyBranch,
  createAdminAccount,
  deleteUserAccount,
  getAdminAccounts,
  getSuperAdminOverview,
  updateAdminSubscription,
  type AdminAccountRecord,
  type CreateAdminAccountPayload,
  type SuperAdminOverview,
} from '@/services/admin/admin.api'
import { getAuthUser, isSuperAdminUser } from '@/lib/auth'
import { Link, Navigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { ClientDetailModal } from '@/components/superadmin/ClientDetailModal'
import { EditSubscriptionModal } from '@/components/superadmin/EditSubscriptionModal'
import {
  buildSuperAdminClientView,
  type EditSubscriptionResult,
  type SuperAdminClientView,
} from '@/lib/superadmin'

interface SubscriptionDraft {
  subscriptionPlan: string
  subscriptionPrice: number
  status: string
  branchLimit: number
  isAdminActive: boolean
}

interface BranchDraft {
  name: string
  address: string
}

const defaultForm: CreateAdminAccountPayload = {
  name: '',
  email: '',
  username: '',
  password: '',
  companyName: '',
  subscriptionPlan: 'BASIC',
  subscriptionPrice: 0,
  status: 'active',
  branchLimit: 1,
  initialBranchName: '',
  initialBranchAddress: '',
}

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

export const Register = () => {
  const user = getAuthUser()
  const [overview, setOverview] = useState<SuperAdminOverview>(emptyOverview)
  const [accounts, setAccounts] = useState<AdminAccountRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingCompanyId, setIsSavingCompanyId] = useState<string | null>(null)
  const [isAddingBranchCompanyId, setIsAddingBranchCompanyId] = useState<string | null>(null)
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<SuperAdminClientView | null>(null)
  const [editingClient, setEditingClient] = useState<SuperAdminClientView | null>(null)
  const [formValues, setFormValues] = useState<CreateAdminAccountPayload>(defaultForm)
  const [drafts, setDrafts] = useState<Record<string, SubscriptionDraft>>({})
  const [branchDrafts, setBranchDrafts] = useState<Record<string, BranchDraft>>({})

  const canAccess = useMemo(() => isSuperAdminUser(user), [user])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [accountsData, overviewData] = await Promise.all([
        getAdminAccounts(),
        getSuperAdminOverview(),
      ])

      setAccounts(accountsData)
      setOverview(overviewData)

      setDrafts(
        accountsData.reduce<Record<string, SubscriptionDraft>>((acc, row) => {
          acc[row.company.id] = {
            subscriptionPlan: row.company.subscriptionPlan,
            subscriptionPrice: row.company.subscriptionPrice,
            status: row.company.status,
            branchLimit: row.company.branchLimit,
            isAdminActive: row.admin.isActive,
          }
          return acc
        }, {}),
      )

      setBranchDrafts(
        accountsData.reduce<Record<string, BranchDraft>>((acc, row) => {
          acc[row.company.id] = {
            name: '',
            address: '',
          }
          return acc
        }, {}),
      )
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible cargar el panel de superadmin'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!canAccess) return
    void loadData()
  }, [canAccess])

  const updateFormField = (field: keyof CreateAdminAccountPayload, value: string) => {
    setFormValues((prev) => {
      if (field === 'branchLimit') {
        return { ...prev, branchLimit: Number(value || 0) }
      }

      if (field === 'subscriptionPrice') {
        return { ...prev, subscriptionPrice: Number(value || 0) }
      }

      return {
        ...prev,
        [field]: value,
      }
    })
  }

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formValues.name.trim() || !formValues.email.trim() || !formValues.password.trim()) {
      toast.error('Completa nombre, correo y contraseña')
      return
    }

    if (!formValues.companyName.trim()) {
      toast.error('Escribe el nombre de la empresa cliente')
      return
    }

    if (formValues.branchLimit < 1) {
      toast.error('El límite de sucursales debe ser mayor a 0')
      return
    }

    if (formValues.subscriptionPrice < 0) {
      toast.error('El precio del plan no puede ser negativo')
      return
    }

    setIsSubmitting(true)
    try {
      await createAdminAccount({
        ...formValues,
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        username: formValues.username?.trim() || null,
        companyName: formValues.companyName.trim(),
        initialBranchName: formValues.initialBranchName?.trim() || null,
        initialBranchAddress: formValues.initialBranchAddress?.trim() || null,
      })

      toast.success('Administrador cliente creado correctamente')
      setFormValues(defaultForm)
      await loadData()
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible crear la cuenta'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateDraft = (
    companyId: string,
    field: keyof SubscriptionDraft,
    value: string | number | boolean,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value,
      },
    }))
  }

  const updateBranchDraft = (companyId: string, field: keyof BranchDraft, value: string) => {
    setBranchDrafts((prev) => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value,
      },
    }))
  }

  const handleSaveSubscription = async (companyId: string) => {
    const payload = drafts[companyId]
    if (!payload) return

    if (payload.branchLimit < 1) {
      toast.error('El límite de sucursales debe ser mayor a 0')
      return
    }

    if (payload.subscriptionPrice < 0) {
      toast.error('El precio del plan no puede ser negativo')
      return
    }

    setIsSavingCompanyId(companyId)
    try {
      await updateAdminSubscription(companyId, payload)
      toast.success('Suscripción actualizada')
      await loadData()
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible actualizar suscripción'))
    } finally {
      setIsSavingCompanyId(null)
    }
  }

  const handleAddBranch = async (companyId: string) => {
    const payload = branchDrafts[companyId]
    if (!payload?.name.trim() || !payload?.address.trim()) {
      toast.error('Escribe nombre y dirección de la sucursal')
      return
    }

    setIsAddingBranchCompanyId(companyId)
    try {
      await addCompanyBranch(companyId, {
        name: payload.name.trim(),
        address: payload.address.trim(),
      })
      toast.success('Sucursal agregada correctamente')
      await loadData()
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible agregar la sucursal'))
    } finally {
      setIsAddingBranchCompanyId(null)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar al usuario ${userName}? Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setIsDeletingUserId(userId)
    try {
      await deleteUserAccount(userId)
      toast.success('Usuario eliminado correctamente')
      await loadData()
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible eliminar el usuario'))
    } finally {
      setIsDeletingUserId(null)
    }
  }

  const openClientDetails = (row: AdminAccountRecord) => {
    setSelectedClient(buildSuperAdminClientView(row))
  }

  const openEditSubscription = (row: AdminAccountRecord) => {
    setEditingClient(buildSuperAdminClientView(row))
  }

  const handleSaveSubscriptionFromModal = async (payload: EditSubscriptionResult) => {
    setIsSavingCompanyId(payload.companyId)
    try {
      await updateAdminSubscription(payload.companyId, {
        subscriptionPlan: payload.subscriptionPlan,
        subscriptionPrice: payload.subscriptionPrice,
        baseMonthlyPrice: payload.baseMonthlyPrice,
        extraBranchPrices: payload.extraBranchPrices,
        discountPercent: payload.discountPercent,
        status: payload.status,
        branchLimit: payload.branchLimit,
        isAdminActive: payload.isAdminActive,
      })
      toast.success('Suscripción actualizada')
      setEditingClient(null)
      await loadData()
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible actualizar suscripción'))
    } finally {
      setIsSavingCompanyId(null)
    }
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso restringido</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Esta sección solo está disponible para el perfil superadmin.
          </p>
          <Link to="/services/list" className="mt-5 inline-flex">
            <Button variant="default">Ir a servicios</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />

      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Superadmin · Clientes y Suscripciones
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Administra planes, límites de sucursales e ingresos de tus clientes desde un solo lugar.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Clientes</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {overview.summary.clients}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Activos {overview.summary.activeClients} · Inactivos {overview.summary.inactiveClients}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Sucursales</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {overview.summary.usedBranches} / {overview.summary.totalBranchLimit}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Disponibles {overview.summary.availableBranches}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Ingreso por planes</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(overview.summary.totalSubscriptionPrice)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Suma mensual de suscripciones</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Ingreso estimado</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(overview.summary.estimatedIncome)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Planes + servicios cobrados</p>
        </Card>
      </section>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Planes de clientes</h2>
          <Button variant="outline" onClick={() => void loadData()} disabled={isLoading}>
            Recargar panel
          </Button>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                <th className="px-2 py-2">Plan</th>
                <th className="px-2 py-2">Clientes</th>
                <th className="px-2 py-2">Precio mensual</th>
                <th className="px-2 py-2">Sucursales</th>
                <th className="px-2 py-2">Cobrado servicios</th>
                <th className="px-2 py-2">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {overview.plans.map((plan) => (
                <tr key={plan.plan} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-2 py-2 font-medium text-gray-900 dark:text-gray-100">{plan.plan}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">{plan.clients}</td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {formatCurrency(plan.monthlyPrice)}
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {plan.usedBranches} / {plan.totalBranchLimit}
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {formatCurrency(plan.totalServiceCollected)}
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {formatCurrency(plan.totalServicePending)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Usuarios y sucursales por cliente
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Controla cuántas sucursales tiene cada administrador contra su límite de plan.
        </p>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700">
                <th className="px-2 py-2">Usuario</th>
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Plan</th>
                <th className="px-2 py-2">Sucursales</th>
                <th className="px-2 py-2">Ingreso plan</th>
                <th className="px-2 py-2">Cobrado servicios</th>
              </tr>
            </thead>
            <tbody>
              {overview.users.map((userRow) => (
                <tr key={userRow.userId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-2 py-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{userRow.name}</p>
                    <p className="text-xs text-gray-500">{userRow.email || 'Sin contacto'}</p>
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {userRow.companyName}
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {userRow.subscriptionPlan}
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {userRow.usedBranches} / {userRow.branchLimit}
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {formatCurrency(userRow.monthlyPrice)}
                  </td>
                  <td className="px-2 py-2 text-gray-600 dark:text-gray-300">
                    {formatCurrency(userRow.serviceCollected)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {overview.users.length === 0 && (
            <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
              Aún no hay usuarios administradores registrados.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Crear administrador cliente</h2>

        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleCreateAdmin}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.name}
              onChange={(e) => updateFormField('name', e.target.value)}
              placeholder="Nombre del administrador"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo</label>
            <input
              type="email"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.email}
              onChange={(e) => updateFormField('email', e.target.value)}
              placeholder="admin@cliente.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuario (opcional)
            </label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.username || ''}
              onChange={(e) => updateFormField('username', e.target.value)}
              placeholder="usuario"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.password}
              onChange={(e) => updateFormField('password', e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa cliente</label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.companyName}
              onChange={(e) => updateFormField('companyName', e.target.value)}
              placeholder="Nombre comercial"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.subscriptionPlan}
              onChange={(e) => updateFormField('subscriptionPlan', e.target.value)}
              placeholder="BASIC / PRO / ENTERPRISE"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Precio mensual del plan
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.subscriptionPrice}
              onChange={(e) => updateFormField('subscriptionPrice', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Estado licencia</label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.status}
              onChange={(e) => updateFormField('status', e.target.value)}
              placeholder="active"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Límite de sucursales
            </label>
            <input
              type="number"
              min={1}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.branchLimit}
              onChange={(e) => updateFormField('branchLimit', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre de sucursal inicial (opcional)
            </label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.initialBranchName || ''}
              onChange={(e) => updateFormField('initialBranchName', e.target.value)}
              placeholder="Si lo dejas vacío se usará: Sucursal principal"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dirección sucursal inicial
            </label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.initialBranchAddress || ''}
              onChange={(e) => updateFormField('initialBranchAddress', e.target.value)}
              placeholder="Dirección"
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear administrador cliente'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clientes administrados</h2>

        {isLoading ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : accounts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No hay cuentas registradas.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {accounts.map((row) => {
              const draft = drafts[row.company.id]
              const branchDraft = branchDrafts[row.company.id]
              return (
                <div key={row.company.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Empresa</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {row.company.name}
                      </p>
                      <p className="text-xs text-gray-500">{row.company.email}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Administrador</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {row.admin.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.admin.email || row.admin.username || 'Sin contacto'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Plan</label>
                      <input
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                        value={draft?.subscriptionPlan || ''}
                        onChange={(e) =>
                          updateDraft(row.company.id, 'subscriptionPlan', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                        Precio mensual
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                        value={draft?.subscriptionPrice ?? 0}
                        onChange={(e) =>
                          updateDraft(
                            row.company.id,
                            'subscriptionPrice',
                            Number(e.target.value || 0),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Estado</label>
                      <input
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                        value={draft?.status || ''}
                        onChange={(e) => updateDraft(row.company.id, 'status', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                        Límite sucursales
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                        value={draft?.branchLimit ?? 1}
                        onChange={(e) =>
                          updateDraft(row.company.id, 'branchLimit', Number(e.target.value || 1))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                        Admin activo
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                        value={draft?.isAdminActive ? 'yes' : 'no'}
                        onChange={(e) =>
                          updateDraft(row.company.id, 'isAdminActive', e.target.value === 'yes')
                        }
                      >
                        <option value="yes">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2 xl:grid-cols-4">
                    <span>
                      Sucursales: <strong>{row.company.usedBranches}</strong> / {row.company.branchLimit}
                    </span>
                    <span>
                      Precio plan: <strong>{formatCurrency(row.company.subscriptionPrice)}</strong>
                    </span>
                    <span>
                      Cobrado servicios: <strong>{formatCurrency(row.metrics.totalServiceAdvance)}</strong>
                    </span>
                    <span>
                      Pendiente servicios: <strong>{formatCurrency(row.metrics.totalServicePending)}</strong>
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      className="min-w-44 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                      placeholder="Nueva sucursal"
                      value={branchDraft?.name || ''}
                      onChange={(e) => updateBranchDraft(row.company.id, 'name', e.target.value)}
                    />
                    <input
                      className="min-w-44 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                      placeholder="Dirección"
                      value={branchDraft?.address || ''}
                      onChange={(e) =>
                        updateBranchDraft(row.company.id, 'address', e.target.value)
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => void handleAddBranch(row.company.id)}
                      disabled={isAddingBranchCompanyId === row.company.id}
                    >
                      {isAddingBranchCompanyId === row.company.id
                        ? 'Agregando...'
                        : 'Agregar sucursal'}
                    </Button>
                  </div>

                  {row.branches.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {row.branches.map((branch) => branch.name).join(' · ')}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openClientDetails(row)}
                    >
                      Ver detalle
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openEditSubscription(row)}
                    >
                      Editar suscripción
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void handleSaveSubscription(row.company.id)}
                      disabled={isSavingCompanyId === row.company.id}
                    >
                      {isSavingCompanyId === row.company.id
                        ? 'Guardando...'
                        : 'Guardar suscripción'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40"
                      onClick={() => void handleDeleteUser(row.admin.id, row.admin.name)}
                      disabled={isDeletingUserId === row.admin.id}
                    >
                      {isDeletingUserId === row.admin.id ? 'Eliminando...' : 'Eliminar usuario'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <ClientDetailModal
        isOpen={Boolean(selectedClient)}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        onEditSubscription={(client) => {
          setSelectedClient(null)
          setEditingClient(client)
        }}
      />

      <EditSubscriptionModal
        isOpen={Boolean(editingClient)}
        onClose={() => setEditingClient(null)}
        client={editingClient}
        onSave={handleSaveSubscriptionFromModal}
        isSaving={isSavingCompanyId === editingClient?.companyId}
      />
    </div>
  )
}
