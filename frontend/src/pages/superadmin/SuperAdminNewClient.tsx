import { useMemo, useState } from 'react'
import { ArrowLeftIcon, Building2Icon, SaveIcon, ShieldPlusIcon } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SUPERADMIN_PLANS } from '@/lib/superadmin'
import {
  createAdminAccount,
  type CreateAdminAccountPayload,
} from '@/services/admin/admin.api'

const defaultForm: CreateAdminAccountPayload = {
  name: '',
  email: '',
  username: '',
  password: '',
  companyName: '',
  subscriptionPlan: 'BASIC',
  subscriptionPrice: SUPERADMIN_PLANS.BASIC.monthlyPrice,
  status: 'active',
  branchLimit: SUPERADMIN_PLANS.BASIC.includedBranches,
  initialBranchName: '',
  initialBranchAddress: '',
}

export const SuperAdminNewClient = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState<CreateAdminAccountPayload>(defaultForm)

  const availablePlans = useMemo(() => Object.values(SUPERADMIN_PLANS), [])

  const updateFormField = (field: keyof CreateAdminAccountPayload, value: string) => {
    setFormValues((prev) => {
      if (field === 'branchLimit') {
        return { ...prev, branchLimit: Number(value || 0) }
      }

      if (field === 'subscriptionPrice') {
        return { ...prev, subscriptionPrice: Number(value || 0) }
      }

      if (field === 'subscriptionPlan') {
        const selectedPlan = SUPERADMIN_PLANS[value.toUpperCase()]
        if (!selectedPlan) {
          return { ...prev, subscriptionPlan: value }
        }

        return {
          ...prev,
          subscriptionPlan: selectedPlan.id,
          subscriptionPrice: selectedPlan.monthlyPrice,
          branchLimit: Math.max(prev.branchLimit, selectedPlan.includedBranches),
        }
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
        email: formValues.email.trim().toLowerCase(),
        username: formValues.username?.trim() || null,
        companyName: formValues.companyName.trim(),
        initialBranchName:
          formValues.initialBranchName?.trim() ||
          `${formValues.companyName.trim()} - Principal`,
        initialBranchAddress: formValues.initialBranchAddress?.trim() || 'Dirección pendiente',
      })

      toast.success('Administrador cliente creado correctamente')
      navigate('/superadmin/clients')
    } catch (error: any) {
      console.error(error)
      toast.error(getApiErrorMessage(error, 'No fue posible crear la cuenta'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Toaster />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Crear Administrador Cliente
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Alta de cliente, plan contratado y sucursal inicial.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/superadmin/clients')}>
          <ArrowLeftIcon size={16} />
          Volver a clientes
        </Button>
      </div>

      <Card className="p-5 sm:p-6">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleCreateAdmin}>
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <ShieldPlusIcon size={16} />
              Datos del administrador
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.name}
              onChange={(event) => updateFormField('name', event.target.value)}
              placeholder="Nombre del administrador"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo</label>
            <input
              type="email"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.email}
              onChange={(event) => updateFormField('email', event.target.value)}
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
              onChange={(event) => updateFormField('username', event.target.value)}
              placeholder="usuario"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.password}
              onChange={(event) => updateFormField('password', event.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="md:col-span-2 mt-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Building2Icon size={16} />
              Datos de la empresa cliente
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa cliente</label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.companyName}
              onChange={(event) => updateFormField('companyName', event.target.value)}
              placeholder="Nombre comercial"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
            <select
              value={formValues.subscriptionPlan}
              onChange={(event) => updateFormField('subscriptionPlan', event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.includedBranches} sucursales incluidas)
                </option>
              ))}
            </select>
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
              onChange={(event) => updateFormField('subscriptionPrice', event.target.value)}
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
              onChange={(event) => updateFormField('branchLimit', event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Estado licencia</label>
            <select
              value={formValues.status}
              onChange={(event) => updateFormField('status', event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
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
              Nombre de sucursal inicial
            </label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.initialBranchName || ''}
              onChange={(event) => updateFormField('initialBranchName', event.target.value)}
              placeholder="Si lo dejas vacío se genera automáticamente"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dirección sucursal inicial
            </label>
            <input
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formValues.initialBranchAddress || ''}
              onChange={(event) => updateFormField('initialBranchAddress', event.target.value)}
              placeholder="Dirección"
            />
          </div>

          <div className="md:col-span-2 mt-2">
            <Button type="submit" variant="default" disabled={isSubmitting}>
              <SaveIcon size={16} />
              {isSubmitting ? 'Guardando...' : 'Crear administrador cliente'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
