import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { CheckIcon, PlusIcon, SearchIcon, UserCircleIcon, UserIcon } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  NewClientFormValue,
  ServiceCatalogsResponse,
  ServiceClientRecord,
  ServiceFormData,
} from '../service.types'

const buildDefaultNewClient = (
  catalogs: ServiceCatalogsResponse,
  preferredBranchId: string
): NewClientFormValue => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  typeClientId: '',
  documentTypeId: '',
  branchId: preferredBranchId || catalogs.branches[0]?.id || '',
})

interface ClientFormStepProps {
  formData: ServiceFormData
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>
  nextStep: () => void
  catalogs: ServiceCatalogsResponse
}

export const ClientFormStep: React.FC<ClientFormStepProps> = ({
  formData,
  setFormData,
  nextStep,
  catalogs,
}) => {
  const { t } = useTranslation(['common', 'services'])
  const [searchQuery, setSearchQuery] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showNewClientForm, setShowNewClientForm] = useState(
    Boolean(formData.newClient) || catalogs.clients.length === 0
  )

  const branchNameById = useMemo(
    () =>
      new Map(catalogs.branches.map((branch) => [branch.id, branch.name] as const)),
    [catalogs.branches]
  )

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return catalogs.clients
    }
    return catalogs.clients.filter((client) => {
      return (
        client.name.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)
      )
    })
  }, [catalogs.clients, searchQuery])

  const selectedClient = formData.client
  const newClient =
    formData.newClient ??
    buildDefaultNewClient(catalogs, formData.serviceDetails.branchId)

  const handleSelectClient = (client: ServiceClientRecord) => {
    setFormData((prev) => ({
      ...prev,
      client,
      clientId: client.id,
      newClient: null,
    }))
    setErrors({})
  }

  const handleShowNewClientForm = () => {
    setShowNewClientForm(true)
    setFormData((prev) => ({
      ...prev,
      client: null,
      clientId: null,
      newClient: prev.newClient ?? buildDefaultNewClient(catalogs, prev.serviceDetails.branchId),
    }))
    setErrors({})
  }

  const handleHideNewClientForm = () => {
    setShowNewClientForm(false)
    setErrors({})
  }

  const handleNewClientChange = (name: keyof NewClientFormValue, value: string) => {
    setFormData((prev) => ({
      ...prev,
      client: null,
      clientId: null,
      newClient: {
        ...(prev.newClient ?? buildDefaultNewClient(catalogs, prev.serviceDetails.branchId)),
        [name]: value,
      },
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev }
        delete nextErrors[name]
        return nextErrors
      })
    }
  }

  const validateNewClient = () => {
    const nextErrors: Record<string, string> = {}

    // Solo nombre y teléfono son obligatorios. El correo, la dirección, el tipo de
    // cliente y el tipo de documento son opcionales.
    if (!newClient.name.trim()) {
      nextErrors.name = t('services:first-step.validations.name')
    }
    if (!newClient.phone.trim()) {
      nextErrors.phone = t('services:first-step.validations.phone')
    }
    // Correo opcional: solo se valida el formato si se escribió algo.
    if (newClient.email.trim() && !/\S+@\S+\.\S+/.test(newClient.email)) {
      nextErrors.email = t('services:first-step.validations.email')
    }
    if (!newClient.branchId) {
      nextErrors.branchId = 'Selecciona una sucursal'
    }

    return nextErrors
  }

  const handleContinue = () => {
    if (showNewClientForm) {
      const validationErrors = validateNewClient()
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      setFormData((prev) => ({
        ...prev,
        client: null,
        clientId: null,
        newClient,
      }))
      setErrors({})
      nextStep()
      return
    }

    if (formData.clientId) {
      setErrors({})
      nextStep()
      return
    }

    setErrors({
      general: t('services:errorGeneral'),
    })
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {t('services:first-step.title')}
      </h2>
      {errors.general && (
        <div className="mb-2 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{errors.general}</p>
        </div>
      )}

      {!showNewClientForm && (
        <>
          <div className="mb-6 flex gap-3">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-white dark:bg-gray-800 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
                placeholder={t('services:first-step.placeholder.searchInput')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleShowNewClientForm}
              icon={<PlusIcon size={16} />}
            >
              {t('services:first-step.buttonAddNewUser')}
            </Button>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-4 border rounded-lg transition-all duration-200 cursor-pointer ${selectedClient?.id === client.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  onClick={() => handleSelectClient(client)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserCircleIcon size={40} className="text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.name}
                        </h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span>{client.phone}</span>
                          <span className="mx-2">•</span>
                          <span>{client.email}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {client.address}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {branchNameById.get(client.branchId) || '-'}
                        </p>
                      </div>
                    </div>
                    {selectedClient?.id === client.id && (
                      <CheckIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 md:col-span-2">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No hay clientes registrados. Crea uno nuevo para continuar.
                </p>
                <Button
                  variant="outline"
                  onClick={handleShowNewClientForm}
                  icon={<PlusIcon size={16} />}
                >
                  Crear cliente
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {showNewClientForm && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('common:actions.new')} {t('services:first-step.stepper.one')}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserName')}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`bg-white dark:bg-gray-800 block w-full pl-10 pr-3 py-2 border ${errors.name
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                      } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder={t('services:first-step.placeholder.newNameInput')}
                    value={newClient.name}
                    onChange={(event) => handleNewClientChange('name', event.target.value)}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserPhone')}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  className={`bg-white dark:bg-gray-800 block w-full py-2 px-3 border ${errors.phone
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                    } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder={t('services:first-step.placeholder.newPhoneInput')}
                  value={newClient.phone}
                  onChange={(event) => handleNewClientChange('phone', event.target.value)}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserEmail')}{' '}
                  <span className="text-xs font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`bg-white dark:bg-gray-800 block w-full py-2 px-3 border ${errors.email
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                    } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder={t('services:first-step.placeholder.newEmailInput')}
                  value={newClient.email}
                  onChange={(event) => handleNewClientChange('email', event.target.value)}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserAddress')}{' '}
                  <span className="text-xs font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className={`bg-white dark:bg-gray-800 block w-full py-2 px-3 border ${errors.address
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                    } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder={t('services:first-step.placeholder.newAddressInput')}
                  value={newClient.address}
                  onChange={(event) => handleNewClientChange('address', event.target.value)}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de cliente{' '}
                  <span className="text-xs font-normal text-gray-400">(opcional)</span>
                </label>
                <Select
                  value={newClient.typeClientId}
                  onValueChange={(value) => handleNewClientChange('typeClientId', value)}
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 w-full py-2 px-3 border ${errors.typeClientId
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                      } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <SelectValue placeholder="Selecciona un tipo de cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.typeClients.map((typeClient) => (
                      <SelectItem key={typeClient.id} value={typeClient.id}>
                        {typeClient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.typeClientId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.typeClientId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de documento{' '}
                  <span className="text-xs font-normal text-gray-400">(opcional)</span>
                </label>
                <Select
                  value={newClient.documentTypeId}
                  onValueChange={(value) => handleNewClientChange('documentTypeId', value)}
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 w-full py-2 px-3 border ${errors.documentTypeId
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                      } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <SelectValue placeholder="Selecciona un tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.documentTypes.map((documentType) => (
                      <SelectItem key={documentType.id} value={documentType.id}>
                        {documentType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.documentTypeId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.documentTypeId}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common:others.branch')} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newClient.branchId}
                  onValueChange={(value) => handleNewClientChange('branchId', value)}
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 w-full py-2 px-3 border ${errors.branchId
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                      } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <SelectValue placeholder="Selecciona una sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogs.branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branchId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.branchId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-8 flex justify-between">
        <div>
          {showNewClientForm && catalogs.clients.length > 0 && (
            <Button variant="outline" onClick={handleHideNewClientForm}>
              {t('common:actions.cancel')}
            </Button>
          )}
        </div>
        <Button variant="default" onClick={handleContinue}>
          {t('common:actions.continue')}
        </Button>
      </div>
    </>
  )
}
