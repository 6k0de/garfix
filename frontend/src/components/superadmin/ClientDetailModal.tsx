import { useEffect, useState } from 'react'
import {
  ActivityIcon,
  BuildingIcon,
  CalendarIcon,
  DollarSignIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TagIcon,
  UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { SuperAdminClientView } from '@/lib/superadmin'

interface ClientDetailModalProps {
  isOpen: boolean
  onClose: () => void
  client: SuperAdminClientView | null
  onEditSubscription: (client: SuperAdminClientView) => void
}

type DetailTab = 'general' | 'subscription' | 'branches' | 'activity' | 'notes'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value || 0)

const getStatusBadgeClass = (status: SuperAdminClientView['status']) => {
  if (status === 'active') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (status === 'trial') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  if (status === 'suspended')
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  if (status === 'expired') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
}

const getPaymentBadgeClass = (status: SuperAdminClientView['paymentStatus']) => {
  if (status === 'current')
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (status === 'pending')
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

const toFriendlyDate = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleDateString()
}

const tabs: Array<{ id: DetailTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'subscription', label: 'Suscripción' },
  { id: 'branches', label: 'Sucursales' },
  { id: 'activity', label: 'Actividad' },
  { id: 'notes', label: 'Notas' },
]

export const ClientDetailModal = ({
  isOpen,
  onClose,
  client,
  onEditSubscription,
}: ClientDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('general')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setActiveTab('general')
    setNotes(client?.notes || '')
  }, [client])

  if (!client) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle del cliente · ${client.companyName}`}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="default" onClick={() => onEditSubscription(client)}>
            Editar suscripción
          </Button>
        </>
      }
    >
      <div className="mb-6 flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[320px]">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                Empresa
              </h4>
              <div className="flex items-start gap-3">
                <BuildingIcon size={18} className="mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{client.companyName}</p>
                  <p className="text-xs text-gray-500">ID: {client.companyId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TagIcon size={18} className="text-gray-400" />
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(client.status)}`}>
                    {client.status}
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                    Plan {client.plan.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                Contacto principal
              </h4>
              <div className="flex items-center gap-3">
                <UserIcon size={18} className="text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{client.contactPerson}</p>
              </div>
              <div className="flex items-center gap-3">
                <MailIcon size={18} className="text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{client.contactEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon size={18} className="text-gray-400" />
                <p className="text-sm text-gray-900 dark:text-white">{client.contactPhone}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-5">
              <div>
                <h4 className="mb-1 text-sm font-semibold text-gray-500 dark:text-gray-400">Plan actual</h4>
                <p className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                  {client.plan.name}
                  {client.customPricing && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Personalizado
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Ciclo</h4>
                  <p className="capitalize text-gray-900 dark:text-white">{client.billingCycle}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Pago</h4>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${getPaymentBadgeClass(client.paymentStatus)}`}>
                    {client.paymentStatus}
                  </span>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Inicio</h4>
                  <p className="text-gray-900 dark:text-white">{toFriendlyDate(client.subscriptionStartDate)}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Renovación</h4>
                  <p className="text-gray-900 dark:text-white">{toFriendlyDate(client.subscriptionEndDate)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/60">
              <h4 className="mb-4 flex items-center text-sm font-semibold text-gray-900 dark:text-white">
                <DollarSignIcon size={16} className="mr-2 text-gray-500" />
                Facturación
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Base del plan</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(client.baseMonthlyPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Extras por sucursal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(
                      client.extraBranchPrices.reduce((total, price) => total + price, 0),
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cobrado servicios</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(client.metrics.totalServiceAdvance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pendiente servicios</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(client.metrics.totalServicePending)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-indigo-700 dark:border-gray-700 dark:text-indigo-400">
                  <span>Ingreso total estimado</span>
                  <span>
                    {formatCurrency(client.monthlyRevenue + client.metrics.totalServiceAdvance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Sucursales asignadas</h4>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Incluidas: <strong className="text-gray-900 dark:text-white">{client.includedBranches}</strong></span>
                <span>Extras: <strong className="text-gray-900 dark:text-white">{client.extraBranches}</strong></span>
                <span>Total: <strong className="text-indigo-600 dark:text-indigo-400">{client.totalBranches}</strong></span>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      Precio extra (mensual)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {client.branches.map((branch, index) => (
                    <tr key={branch.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <MapPinIcon size={16} className="mr-2 text-gray-400" />
                          {branch.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {branch.address}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {index < client.includedBranches ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Incluida
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-indigo-100 px-2 text-xs font-semibold leading-5 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                            Extra
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {index < client.includedBranches
                          ? 'Incluida'
                          : formatCurrency(
                              client.extraBranchPrices[index - client.includedBranches] || 0,
                            )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
              <div className="mb-2 flex items-center text-gray-500 dark:text-gray-400">
                <UserIcon size={18} className="mr-2" />
                <span className="text-sm font-medium">Usuarios activos</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {client.activeUsers}{' '}
                <span className="text-sm font-normal text-gray-500">/ {client.totalUsers}</span>
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
              <div className="mb-2 flex items-center text-gray-500 dark:text-gray-400">
                <ActivityIcon size={18} className="mr-2" />
                <span className="text-sm font-medium">Servicios totales</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {client.metrics.servicesCount}
              </p>
              <p className="text-xs text-gray-500">Solicitudes: {client.metrics.serviceRequestsCount}</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
              <div className="mb-2 flex items-center text-gray-500 dark:text-gray-400">
                <CalendarIcon size={18} className="mr-2" />
                <span className="text-sm font-medium">Última actividad</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {toFriendlyDate(client.lastActivity)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notas administrativas (solo superadmin)
            </label>
            <textarea
              rows={6}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Añade notas internas del cliente..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="flex justify-end">
              <Button variant="default" onClick={() => setNotes(notes)}>
                Guardar notas
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
