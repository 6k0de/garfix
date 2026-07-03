import { useEffect, useMemo, useState } from 'react'
import {
  BuildingIcon,
  EditIcon,
  EyeIcon,
  FilterIcon,
  PauseIcon,
  PlayIcon,
  PlusCircleIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ClientDetailModal } from '@/components/superadmin/ClientDetailModal'
import { EditSubscriptionModal } from '@/components/superadmin/EditSubscriptionModal'
import {
  addCompanyBranch,
  deleteUserAccount,
  getAdminAccounts,
  updateAdminSubscription,
} from '@/services/admin/admin.api'
import { buildSuperAdminClientView, type SuperAdminClientView } from '@/lib/superadmin'

const statusLabels: Record<SuperAdminClientView['status'], string> = {
  active: 'Activo',
  trial: 'Prueba',
  suspended: 'Suspendido',
  expired: 'Expirado',
  canceled: 'Cancelado',
}

const statusBadgeClass: Record<SuperAdminClientView['status'], string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  canceled: 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value || 0)

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString()
}

export const SuperAdminClients = () => {
  const [clients, setClients] = useState<SuperAdminClientView[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SuperAdminClientView['status']>('all')
  const [planFilter, setPlanFilter] = useState<'all' | string>('all')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<SuperAdminClientView | null>(null)
  const [isSavingCompanyId, setIsSavingCompanyId] = useState<string | null>(null)
  const [isDeletingUserId, setIsDeletingUserId] = useState<string | null>(null)
  const [isAddingBranchCompanyId, setIsAddingBranchCompanyId] = useState<string | null>(null)

  const loadClients = async () => {
    setIsLoading(true)
    try {
      const rows = await getAdminAccounts()
      setClients(rows.map((row) => buildSuperAdminClientView(row)))
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible cargar los clientes'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadClients()
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 ||
        client.companyName.toLowerCase().includes(normalizedSearch) ||
        client.contactEmail.toLowerCase().includes(normalizedSearch) ||
        client.contactPerson.toLowerCase().includes(normalizedSearch)

      const matchesStatus = statusFilter === 'all' || client.status === statusFilter
      const matchesPlan = planFilter === 'all' || client.plan.id === planFilter

      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [clients, searchTerm, statusFilter, planFilter])

  const planOptions = useMemo(() => {
    const plans = new Map<string, string>()
    clients.forEach((client) => {
      plans.set(client.plan.id, client.plan.name)
    })
    return Array.from(plans.entries()).map(([id, name]) => ({ id, name }))
  }, [clients])

  const handleViewClient = (client: SuperAdminClientView) => {
    setSelectedClient(client)
    setDetailModalOpen(true)
  }

  const handleEditClient = (client: SuperAdminClientView) => {
    setSelectedClient(client)
    setEditModalOpen(true)
  }

  const handleToggleStatus = async (client: SuperAdminClientView) => {
    const newStatus = client.status === 'suspended' ? 'active' : 'suspended'
    setIsSavingCompanyId(client.companyId)
    try {
      await updateAdminSubscription(client.companyId, {
        status: newStatus,
        isAdminActive: newStatus !== 'suspended',
      })

      setClients((prev) =>
        prev.map((current) =>
          current.companyId === client.companyId
            ? {
                ...current,
                status: newStatus,
                adminIsActive: newStatus !== 'suspended',
                activeUsers: newStatus !== 'suspended' ? current.totalUsers : 0,
              }
            : current,
        ),
      )

      toast.success(
        newStatus === 'suspended'
          ? 'Cliente suspendido correctamente'
          : 'Cliente reactivado correctamente',
      )
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible actualizar el estatus'))
    } finally {
      setIsSavingCompanyId(null)
    }
  }

  const handleSaveSubscription = async (payload: {
    companyId: string
    subscriptionPlan: string
    subscriptionPrice: number
    baseMonthlyPrice: number
    extraBranchPrices: number[]
    discountPercent: number
    status: SuperAdminClientView['status']
    branchLimit: number
    isAdminActive: boolean
  }) => {
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
      setEditModalOpen(false)
      await loadClients()
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible actualizar la suscripción'))
    } finally {
      setIsSavingCompanyId(null)
    }
  }

  const handleDeleteUser = async (client: SuperAdminClientView) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar al usuario ${client.contactPerson}? Esta acción no se puede deshacer.`,
    )
    if (!confirmed) return

    setIsDeletingUserId(client.adminId)
    try {
      await deleteUserAccount(client.adminId)
      toast.success('Usuario eliminado correctamente')
      await loadClients()
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible eliminar el usuario'))
    } finally {
      setIsDeletingUserId(null)
    }
  }

  const handleAddBranch = async (client: SuperAdminClientView) => {
    const name = window.prompt(`Nombre de la nueva sucursal para ${client.companyName}`)
    if (!name?.trim()) return

    const address =
      window.prompt(`Dirección de la sucursal "${name.trim()}"`)?.trim() || 'Dirección pendiente'

    setIsAddingBranchCompanyId(client.companyId)
    try {
      await addCompanyBranch(client.companyId, { name: name.trim(), address })
      toast.success('Sucursal agregada correctamente')
      await loadClients()
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible agregar la sucursal'))
    } finally {
      setIsAddingBranchCompanyId(null)
    }
  }

  const totalClients = clients.length
  const activeClients = clients.filter((client) => client.status === 'active').length
  const suspendedClients = clients.filter((client) => client.status === 'suspended').length
  const monthlyRevenue = clients.reduce((total, client) => total + client.monthlyRevenue, 0)

  return (
    <div className="space-y-6">
      <Toaster />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Clientes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra suscripciones, planes, sucursales y estado de tus clientes.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadClients()} disabled={isLoading}>
          Recargar clientes
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total clientes</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{totalClients}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Clientes activos</p>
          <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-300">
            {activeClients}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Suspendidos</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-300">
            {suspendedClients}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Ingreso mensual</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(monthlyRevenue)}
          </p>
        </Card>
      </section>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por empresa, contacto o email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[170px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FilterIcon size={16} className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | SuperAdminClientView['status'])
                }
                className="block w-full appearance-none rounded-md border border-gray-300 bg-gray-50 py-2 pl-10 pr-8 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="trial">Prueba</option>
                <option value="suspended">Suspendidos</option>
                <option value="expired">Expirados</option>
                <option value="canceled">Cancelados</option>
              </select>
            </div>

            <select
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
              className="block min-w-[170px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Todos los planes</option>
              {planOptions.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Plan y ciclo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Sucursales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Facturación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {filteredClients.map((client) => (
                <tr key={client.companyId} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <BuildingIcon size={20} className="text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.companyName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {client.contactEmail}
                        </div>
                        <div className="text-xs text-gray-400">Alta: {formatDate(client.subscriptionStartDate)}</div>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {client.plan.name}
                    </div>
                    <div className="text-xs capitalize text-gray-500 dark:text-gray-400">
                      {client.billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass[client.status]}`}>
                      {statusLabels[client.status]}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{client.branches.length}</span> usadas /{' '}
                      <span className="font-medium">{client.totalBranches}</span> disponibles
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {client.includedBranches} incluidas · {client.extraBranches} extras
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(client.monthlyRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Cobrado: {formatCurrency(client.metrics.totalServiceAdvance)}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleViewClient(client)}
                        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:text-gray-400 dark:hover:bg-violet-900/20 dark:hover:text-violet-300"
                        title="Ver detalles"
                      >
                        <EyeIcon size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditClient(client)}
                        className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                        title="Editar suscripción"
                      >
                        <EditIcon size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(client)}
                        disabled={isSavingCompanyId === client.companyId}
                        className={`rounded-md p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          client.status === 'suspended'
                            ? 'text-green-600 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-900/20'
                            : 'text-amber-600 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/20'
                        }`}
                        title={client.status === 'suspended' ? 'Reactivar cliente' : 'Suspender cliente'}
                      >
                        {client.status === 'suspended' ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleAddBranch(client)}
                        disabled={isAddingBranchCompanyId === client.companyId}
                        className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Agregar sucursal"
                      >
                        <PlusCircleIcon size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteUser(client)}
                        disabled={isDeletingUserId === client.adminId}
                        className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Eliminar usuario"
                      >
                        <Trash2Icon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron clientes con los filtros actuales.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Cargando clientes...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ClientDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        client={selectedClient}
        onEditSubscription={(client) => {
          setDetailModalOpen(false)
          handleEditClient(client)
        }}
      />

      <EditSubscriptionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        client={selectedClient}
        onSave={handleSaveSubscription}
        isSaving={isSavingCompanyId === selectedClient?.companyId}
      />
    </div>
  )
}
