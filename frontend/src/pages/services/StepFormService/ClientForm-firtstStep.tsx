import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'

import {
  CheckIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  UserCircleIcon,
  UserIcon,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useTranslation } from 'react-i18next'

const clientDataExample = [
  {
    id: 1,
    name: 'Cliente 1',
    phone: '1234567890',
    email: 'cliente1@example.com',
    address: 'Calle 123, Ciudad',
    typeClient: 'personal',
    documentType: 'DNI',
  },
  {
    id: 2,
    name: 'Cliente 2',
    email: 'cliente2@example.com',
    phone: '9876543210',
    address: 'Avenida 456, Pueblo',
  },
  {
    id: 3,
    name: 'Cliente 3',
    email: 'cliente3@example.com',
    phone: '5555555555',
    address: 'Calle 789, Pueblo',
  },
  {
    id: 4,
    name: 'Cliente 4',
    email: 'cliente4@example.com',
    phone: '1112223333',
    address: 'Calle 101, Pueblo',
  },
  {
    id: 5,
    name: 'Cliente 5',
    email: 'cliente5@example.com',
    phone: '2223334444',
    address: 'Calle 102, Pueblo',
  },
]
export const ClientFormStep: React.FC<{
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  nextStep: () => void
}> = ({ formData, setFormData, nextStep }) => {
  const { t } = useTranslation(['common', 'services'])

  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState(clientDataExample)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [filteredClients, setFilteredClients] = useState(clientDataExample)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim() === '') {
      setFilteredClients(clientDataExample)
    } else {
      const filtered = clientDataExample.filter(
        (client) =>
          client.name.toLowerCase().includes(query.toLowerCase()) ||
          client.phone.includes(query) ||
          client.email.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredClients(filtered)
    }
  }

  const handleSelectClient = (client: any) => {
    setSelectedClient(client)
    setFormData({
      ...formData,
      client,
    })
  }

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      newClient: {
        ...formData.newClient,
        [name]: value,
      },
    })
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = {
          ...prev,
        }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSaveNewClientProvisional = (goNext = false) => {
    const validationErrors = validateNewClient()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const tempClient = {
      id: `tmp-${Date.now()}`,
      ...formData.newClient,
      isNew: true, // <- bandera clave
    }

    // lo agregamos a la lista visible
    setClients((prev) => [tempClient, ...prev])
    setSelectedClient(tempClient)

    // lo guardamos como “cliente elegido” del form
    setFormData((prev: any) => ({
      ...prev,
      client: tempClient,
      newClient: null, // limpiamos el form de nuevo cliente
    }))

    setShowNewClientForm(false)
    setErrors({})

    if (goNext) nextStep()
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients)
    } else {
      const q = searchQuery.toLowerCase()
      setFilteredClients(
        clients.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone?.includes(searchQuery) ||
            c.email?.toLowerCase().includes(q)
        )
      )
    }
  }, [clients, searchQuery])

  const validateNewClient = () => {
    const newErrors: Record<string, string> = {}
    const { newClient } = formData
    if (!newClient?.name)
      newErrors.name = t('services:first-step.validations.name')
    if (!newClient?.phone)
      newErrors.phone = t('services:first-step.validations.phone')
    if (newClient?.email && !/\S+@\S+\.\S+/.test(newClient.email)) {
      newErrors.email = t('services:first-step.validations.email')
    }
    return newErrors
  }

  const handleContinue = () => {
    if (selectedClient) {
      nextStep()
    } else if (showNewClientForm) {
      const validationErrors = validateNewClient()
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
      nextStep()
    } else {
      setErrors({
        general: t('services:errorGeneral'),
      })
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {t('services:first-step.title')}
      </h2>
      {errors.general && (
        <div className="mb-2 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">
            {errors.general}
          </p>
        </div>
      )}
      {!showNewClientForm && (
        <>
          <div className="mb-6 flex gap-3">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
                <div className="flex justify-center"></div>
              </div>
              <input
                type="text"
                className="bg-white  dark:bg-gray-800 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
                placeholder={t('services:first-step.placeholder.searchInput')}
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowNewClientForm(true)}
              icon={<PlusIcon size={16} />}
            >
              {t('services:first-step.buttonAddNewUser')}
            </Button>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-4">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedClient?.id === client.id
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
                      </div>
                    </div>
                    {selectedClient?.id === client.id && (
                      <CheckIcon
                        size={20}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('services:noData')}
                </p>
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
            <div className="flex gap-4">
              <div className="flex-1 w-full">
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
                    className={`bg-white dark:bg-gray-800 block w-full pl-10 pr-3 py-2 border ${
                      errors.name
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-gray-300 dark:border-gray-700'
                    } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder={t(
                      'services:first-step.placeholder.newNameInput'
                    )}
                    value={formData.newClient?.name || ''}
                    onChange={handleNewClientChange}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="flex-1 w-full">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserPhone')}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      ></path>
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={`bg-white dark:bg-gray-800 block w-full pl-10 pr-3 py-2 border ${
                      errors.phone
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-gray-300 dark:border-gray-700'
                    } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="(123) 456-7890"
                    value={formData.newClient?.phone || ''}
                    onChange={handleNewClientChange}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 w-full">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserEmail')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      ></path>
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`bg-white dark:bg-gray-800 block w-full pl-10 pr-3 py-2 border ${
                      errors.email
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-gray-300 dark:border-gray-700'
                    } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder={t(
                      'services:first-step.placeholder.newEmailInput'
                    )}
                    value={formData.newClient?.email || ''}
                    onChange={handleNewClientChange}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="flex-1 w-full">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className="bg-white dark:bg-gray-800 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={t(
                      'services:first-step.placeholder.newAddressInput'
                    )}
                    value={formData.newClient?.address || ''}
                    onChange={handleNewClientChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 w-full">
                <label
                  htmlFor="clientType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserTypeClient')}
                </label>
                <Select
                  value={formData.newClient?.typeClient ?? ''}
                  onValueChange={(val) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      newClient: {
                        ...(prev.newClient ?? {}),
                        typeClient: val,
                      },
                    }))
                  }
                >
                  <SelectTrigger className="w-full py-4 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <SelectValue
                      placeholder={t(
                        'services:first-step.placeholder.newTypeClientInput'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal"> Personal </SelectItem>
                    <SelectItem value="empresa"> Empresa </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 w-full">
                <label
                  htmlFor="documentType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:first-step.labelInput.newLabelUserDocumentType')}
                </label>
                <Select
                  value={formData.newClient?.documentType ?? ''}
                  onValueChange={(val) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      newClient: {
                        ...(prev.newClient ?? {}),
                        documentType: val,
                      },
                    }))
                  }
                >
                  <SelectTrigger className="w-full py-4 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <SelectValue
                      placeholder={t(
                        'services:first-step.placeholder.newDocumentType'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passaporte"> PASSAPORTE </SelectItem>
                    <SelectItem value="ine"> INE </SelectItem>
                    <SelectItem value="rfc"> RFC </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center">
            <Button
              variant="destructive"
              className="mr-3"
              onClick={() => {
                setShowNewClientForm(false)
                setFormData({
                  ...formData,
                  newClient: null,
                })
              }}
            >
              {t('common:actions.cancel')}

            </Button>
            <Button
              variant="outline"
              onClick={() => handleSaveNewClientProvisional(false)} // solo guardar provisional
              className="ml-auto"
            >
              {t('services:first-step.buttonSaveandUseNewUser')}
            </Button>
          </div>
        </Card>
      )}
      <div className="mt-8 flex justify-end">
        <Button variant="default" onClick={handleContinue} className="ml-3">
          {t('common:actions.continue')}
        </Button>
      </div>
    </>
  )
}
