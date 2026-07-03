import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  SUPERADMIN_PLANS,
  type BillingCycle,
  type ClientStatus,
  type EditSubscriptionResult,
  type SuperAdminClientView,
} from '@/lib/superadmin'

interface EditSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  client: SuperAdminClientView | null
  onSave: (payload: EditSubscriptionResult) => Promise<void> | void
  isSaving?: boolean
}

interface EditDraft {
  planId: string
  billingCycle: BillingCycle
  customPricing: boolean
  customMonthlyPrice: number
  customYearlyPrice: number
  extraBranchPrices: number[]
  discount: number
  subscriptionEndDate: string
  status: ClientStatus
  isAdminActive: boolean
}

const toDateInput = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().split('T')[0]
}

const sanitizeExtraBranchPrices = (values: Array<number | null | undefined> | null | undefined) =>
  (values ?? [])
    .map((value) => Number(value ?? 0))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .map((value) => Number(value.toFixed(2)))

const buildDefaultExtraBranchPrices = (count: number, defaultPrice: number) =>
  Array.from({ length: Math.max(0, count) }, () => Number(defaultPrice.toFixed(2)))

const buildDraft = (client: SuperAdminClientView): EditDraft => {
  const persistedPrices = sanitizeExtraBranchPrices(client.extraBranchPrices)
  const extraCount = Math.max(client.extraBranches, persistedPrices.length)
  const completePrices =
    persistedPrices.length >= extraCount
      ? persistedPrices.slice(0, extraCount)
      : [
          ...persistedPrices,
          ...buildDefaultExtraBranchPrices(extraCount - persistedPrices.length, client.plan.extraBranchCost),
        ]

  return {
    planId: client.plan.id,
    billingCycle: client.billingCycle,
    customPricing: client.customPricing,
    customMonthlyPrice: client.customMonthlyPrice,
    customYearlyPrice: client.customYearlyPrice,
    extraBranchPrices: completePrices,
    discount: client.discount,
    subscriptionEndDate: toDateInput(client.subscriptionEndDate),
    status: client.status,
    isAdminActive: client.adminIsActive,
  }
}

export const EditSubscriptionModal = ({
  isOpen,
  onClose,
  client,
  onSave,
  isSaving = false,
}: EditSubscriptionModalProps) => {
  const [draft, setDraft] = useState<EditDraft | null>(null)

  useEffect(() => {
    if (!client) {
      setDraft(null)
      return
    }

    setDraft(buildDraft(client))
  }, [client])

  const activePlan = useMemo(() => {
    if (!draft?.planId) return null
    return SUPERADMIN_PLANS[draft.planId] || null
  }, [draft?.planId])

  if (!client || !draft) return null

  const normalizedExtraBranchPrices = sanitizeExtraBranchPrices(draft.extraBranchPrices)
  const extraBranches = normalizedExtraBranchPrices.length

  const basePrice = draft.customPricing
    ? draft.billingCycle === 'monthly'
      ? draft.customMonthlyPrice
      : draft.customYearlyPrice
    : draft.billingCycle === 'monthly'
      ? activePlan?.monthlyPrice || 0
      : activePlan?.yearlyPrice || 0

  const extraBranchCost =
    normalizedExtraBranchPrices.reduce((total, price) => total + price, 0) *
    (draft.billingCycle === 'monthly' ? 1 : 10)
  const subtotal = basePrice + extraBranchCost
  const discountAmount = subtotal * (draft.discount / 100)
  const total = subtotal - discountAmount

  const includedBranches = activePlan?.includedBranches || client.includedBranches
  const branchLimit = includedBranches + extraBranches
  const monthlyPrice = draft.billingCycle === 'monthly' ? total : total / 12
  const baseMonthlyPrice = draft.billingCycle === 'monthly' ? basePrice : basePrice / 12

  const handlePlanChange = (planId: string) => {
    const plan = SUPERADMIN_PLANS[planId]
    if (!plan) return

    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        planId: plan.id,
        customPricing: false,
        customMonthlyPrice: plan.monthlyPrice,
        customYearlyPrice: plan.yearlyPrice,
        extraBranchPrices:
          prev.extraBranchPrices.length > 0
            ? prev.extraBranchPrices.map(() => plan.extraBranchCost)
            : prev.extraBranchPrices,
      }
    })
  }

  const updateDraft = <K extends keyof EditDraft>(key: K, value: EditDraft[K]) => {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [key]: value,
      }
    })
  }

  const setExtraBranchCount = (count: number) => {
    const normalizedCount = Math.max(0, Math.round(count))
    const defaultPrice = activePlan?.extraBranchCost || client.plan.extraBranchCost || 0
    setDraft((prev) => {
      if (!prev) return prev
      if (normalizedCount === prev.extraBranchPrices.length) return prev
      if (normalizedCount < prev.extraBranchPrices.length) {
        return {
          ...prev,
          extraBranchPrices: prev.extraBranchPrices.slice(0, normalizedCount),
        }
      }
      return {
        ...prev,
        extraBranchPrices: [
          ...prev.extraBranchPrices,
          ...buildDefaultExtraBranchPrices(
            normalizedCount - prev.extraBranchPrices.length,
            defaultPrice,
          ),
        ],
      }
    })
  }

  const updateExtraBranchPrice = (index: number, value: number) => {
    const normalizedValue = Number.isFinite(value) && value >= 0 ? value : 0
    setDraft((prev) => {
      if (!prev) return prev
      const next = [...prev.extraBranchPrices]
      next[index] = Number(normalizedValue.toFixed(2))
      return {
        ...prev,
        extraBranchPrices: next,
      }
    })
  }

  const extraBranchNames = client.branches
    .slice(includedBranches)
    .map((branch) => branch.name)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    await onSave({
      companyId: client.companyId,
      subscriptionPlan: draft.planId,
      subscriptionPrice: Number(monthlyPrice.toFixed(2)),
      baseMonthlyPrice: Number(baseMonthlyPrice.toFixed(2)),
      extraBranchPrices: normalizedExtraBranchPrices,
      discountPercent: Number(draft.discount.toFixed(2)),
      status: draft.status,
      branchLimit: Math.max(1, Math.round(branchLimit)),
      isAdminActive: draft.isAdminActive,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar suscripción · ${client.companyName}`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plan base
            </label>
            <select
              value={draft.planId}
              onChange={(event) => handlePlanChange(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {Object.values(SUPERADMIN_PLANS).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ciclo de facturación
            </label>
            <select
              value={draft.billingCycle}
              onChange={(event) => updateDraft('billingCycle', event.target.value as BillingCycle)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="mb-4 flex items-center gap-2">
            <input
              id="custom-pricing"
              type="checkbox"
              checked={draft.customPricing}
              onChange={(event) => updateDraft('customPricing', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="custom-pricing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Usar precio personalizado
            </label>
          </div>

          {draft.customPricing && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Precio mensual
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.customMonthlyPrice}
                  onChange={(event) =>
                    updateDraft('customMonthlyPrice', Number(event.target.value || 0))
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Precio anual
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.customYearlyPrice}
                  onChange={(event) =>
                    updateDraft('customYearlyPrice', Number(event.target.value || 0))
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sucursales extras
            </label>
            <input
              type="number"
              min={0}
              value={extraBranches}
              onChange={(event) => setExtraBranchCount(Number(event.target.value || 0))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descuento (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.discount}
              onChange={(event) => updateDraft('discount', Number(event.target.value || 0))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Límite final de sucursales
            </label>
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              {Math.max(1, Math.round(branchLimit))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/60">
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Precio por sucursal extra
          </h4>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Puedes asignar un precio mensual distinto a cada sucursal extra de este cliente.
          </p>

          {extraBranches === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay sucursales extras configuradas.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {normalizedExtraBranchPrices.map((price, index) => (
                <div key={`extra-branch-price-${index}`}>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">
                    {extraBranchNames[index] || `Sucursal extra ${index + 1}`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      updateExtraBranchPrice(index, Number(event.target.value || 0))
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Renovación estimada
            </label>
            <input
              type="date"
              value={draft.subscriptionEndDate}
              onChange={(event) => updateDraft('subscriptionEndDate', event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado de la cuenta
            </label>
            <select
              value={draft.status}
              onChange={(event) => updateDraft('status', event.target.value as ClientStatus)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="active">Activo</option>
              <option value="trial">Prueba</option>
              <option value="suspended">Suspendido</option>
              <option value="expired">Expirado</option>
              <option value="canceled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Usuario administrador activo
            </label>
            <select
              value={draft.isAdminActive ? 'yes' : 'no'}
              onChange={(event) => updateDraft('isAdminActive', event.target.value === 'yes')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/50 dark:bg-indigo-900/20">
          <h4 className="mb-2 text-sm font-semibold text-indigo-900 dark:text-indigo-300">
            Calculadora de precio final
          </h4>

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Base</span>
              <span className="font-medium text-gray-900 dark:text-white">${basePrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Sucursales extras</span>
              <span className="font-medium text-gray-900 dark:text-white">
                +${extraBranchCost.toFixed(2)}
              </span>
            </div>
            {draft.discount > 0 && (
              <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                <span>Descuento ({draft.discount}%)</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-indigo-200 pt-2 text-base font-semibold text-indigo-700 dark:border-indigo-900/70 dark:text-indigo-300">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="default" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
