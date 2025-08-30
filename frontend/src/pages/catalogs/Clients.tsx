import React, { useEffect, useState } from 'react'
import {
  PlusIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  User as UserIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  FileText as FileTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { CatalogForm } from '@/components/ui/CatalogForm'
import { Trans, useTranslation } from 'react-i18next'
interface Client {
  id?: number
  name: string
  phone: string
  email: string
  address: string
  documentTypeId: string
  typeClientId: string
  servicesCount?: number
}
export const Clients: React.FC = () => {
  const { t } = useTranslation(['common', 'client'])
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: 'Cliente 1',
      phone: '1234567890',
      email: 'cliente1@example.com',
      address: 'Calle 123, Ciudad',
      documentTypeId: '6',
      typeClientId: '4',
    },
    {
      id: 2,
      name: 'Cliente 2',
      email: 'cliente2@example.com',
      phone: '9876543210',
      address: 'Avenida 456, Pueblo',
      documentTypeId: '5',
      typeClientId: '5',
    },
    {
      id: 3,
      name: 'Cliente 3',
      email: 'cliente3@example.com',
      phone: '5555555555',
      address: 'Calle 789, Pueblo',
      documentTypeId: '4',
      typeClientId: '4',
    },
    {
      id: 4,
      name: 'Cliente 4',
      email: 'cliente4@example.com',
      phone: '1112223333',
      address: 'Calle 101, Pueblo',
      documentTypeId: '1',
      typeClientId: '4',
    },
    {
      id: 5,
      name: 'Cliente 5',
      email: 'cliente5@example.com',
      phone: '2223334444',
      address: 'Calle 102, Pueblo',
      documentTypeId: '3',
      typeClientId: '2',
    },
  ])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [formValues, setFormValues] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    documentTypeId: '',
    typeClientId: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const documentTypes = [
    { id: '1', label: 'INE / IFE' },
    { id: '2', label: 'Pasaporte' },
    { id: '3', label: 'Licencia de conducir' },
    { id: '4', label: 'Cédula profesional' },
    { id: '5', label: 'RFC' },
    { id: '6', label: 'Cartilla militar' },
  ]

  const clientTypes = [
    { id: '1', label: 'Individual' },
    { id: '2', label: 'Corporativo' },
    { id: '3', label: 'Distribuidor' },
    { id: '4', label: 'Gubernamental' },
    { id: '5', label: 'Educativo' },
  ]

  useEffect(() => {
    if (currentClient) {
      setFormValues({
        name: currentClient.name,
        phone: currentClient.phone,
        email: currentClient.email,
        address: currentClient.address,
        documentTypeId: currentClient.documentTypeId,
        typeClientId: currentClient.typeClientId,
      })
    } else {
      setFormValues({
        name: '',
        phone: '',
        email: '',
        address: '',
        documentTypeId: '',
        typeClientId: '',
      })
    }
  }, [currentClient])

  const itemsPerPage = 5
  const totalPages = Math.ceil(clients.length / itemsPerPage)
  const paginatedServices = clients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const handleOpenModal = (client?: Client) => {
    setCurrentClient(client || null)
    setFormErrors({})
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentClient(null)
  }
  const handleOpenDeleteModal = (client: Client) => {
    setCurrentClient(client)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentClient(null)
  }
  const handleInputChange = (name: string, value: string) => {
    setFormValues({
      ...formValues,
      [name]: value,
    })
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = {
          ...prev,
        }
        delete newErrors[name]
        return newErrors
      })
    }
  }
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formValues.name.trim()) {
      errors.name = t('client:form.validations.name')
    }
    if (!formValues.phone.trim()) {
      errors.phone = t('client:form.validations.phone')
    }
    if (
      formValues.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)
    ) {
      errors.email = t('client:form.validations.email')
    }
    if (!formValues.typeClientId) {
      errors.clientType = t('client:form.validations.typeClient')
    }
    if (!formValues.documentTypeId) {
      errors.documentTypeId = t('client:form.validations.documentType')
    }
    return errors
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      if (currentClient) {
        // Update existing client
        setClients(
          clients.map((client) =>
            client.id === currentClient.id
              ? {
                  ...client,
                  name: formValues.name,
                  phone: formValues.phone,
                  email: formValues.email,
                  address: formValues.address,
                  documentTypeId: formValues.documentTypeId,
                  typeClientId: formValues.typeClientId,
                }
              : client
          )
        )
      } else {
        // Create new client
        const newClient: Client = {
          name: formValues.name,
          phone: formValues.phone,
          email: formValues.email,
          address: formValues.address,
          documentTypeId: formValues.documentTypeId,
          typeClientId: formValues.typeClientId,
          servicesCount: 0,
        }
        setClients([...clients, newClient])
      }
      setIsSubmitting(false)
      handleCloseModal()
    }, 500)
  }
  const handleDelete = () => {
    if (!currentClient) return
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setClients(clients.filter((client) => client.id !== currentClient.id))
      setIsSubmitting(false)
      handleCloseDeleteModal()
    }, 500)
  }
  const formFields = [
    {
      name: 'name',
      label: t('client:form.newFields.name'),
      type: 'text' as const,
      required: true,
      placeholder: t('client:form.newFields.namePlaceholder'),
    },
    {
      name: 'phone',
      label: t('client:form.newFields.phone'),
      type: 'text' as const,
      required: true,
      placeholder: t('client:form.newFields.phonePlaceholder'),
    },
    {
      name: 'email',
      label: t('client:form.newFields.email'),
      type: 'text' as const,
      placeholder: t('client:form.newFields.emailPlaceholder'),
    },
    {
      name: 'address',
      label: t('client:form.newFields.address'),
      type: 'text' as const,
      placeholder: t('client:form.newFields.addressPlaceholder'),
    },
    {
      name: 'typeClientId',
      label: t('client:form.newFields.clientType'),
      type: 'select' as const,
      required: true,
      options: clientTypes.map((type) => ({
        value: type.id,
        label: type.label,
      })),
    },
    {
      name: 'documentTypeId',
      label: t('client:form.newFields.documentType'),
      type: 'select' as const,
      options: documentTypes.map((type) => ({
        value: type.id,
        label: type.label,
      })),
    },
  ]

  const typeClientId = Object.fromEntries(clientTypes.map((b) => [b.id, b]))
  const documentTypeId = Object.fromEntries(documentTypes.map((r) => [r.id, r]))
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('client:title')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('client:subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="default"
            icon={<PlusIcon size={16} />}
            onClick={() => handleOpenModal()}
          >
            {t('client:newBotton')}
          </Button>
        </div>
      </div>
      <Card className="py-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('client:table.columns.client')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('client:table.columns.contact')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('client:table.columns.typeClient')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('client:table.columns.documentTyoe')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('client:table.columns.services')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('common:actions.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedServices.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <UserIcon
                          size={20}
                          className="text-gray-500 dark:text-gray-400"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {client.address ?? ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center mb-1">
                        <PhoneIcon
                          size={14}
                          className="mr-1.5 text-gray-500 dark:text-gray-400"
                        />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center">
                          <MailIcon
                            size={14}
                            className="mr-1.5 text-gray-500 dark:text-gray-400"
                          />
                          <span>{client.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {typeClientId[client.typeClientId ?? '']?.label ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {documentTypeId[client.documentTypeId ?? ''].label ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <FileTextIcon size={12} className="mr-1" />
                      {client.servicesCount ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(client)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Editar"
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(client)}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                          client.servicesCount! > 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        title={
                          client.servicesCount! > 0
                            ? 'No se puede eliminar porque tiene servicios asociados'
                            : 'Eliminar'
                        }
                        disabled={client.servicesCount! > 0}
                      >
                        <DeleteIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t('client:table.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-400">
                {t('common:actions.show')}{' '}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                {t('common:table.a')}{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, clients.length)}
                </span>{' '}
                {t('common:table.of')}{' '}
                <span className="font-medium">{clients.length}</span>{' '}
                {t('common:actions.results_other')}
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon size={18} />
                </button>
                {Array.from(
                  {
                    length: totalPages,
                  },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      page === currentPage
                        ? 'z-10 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } text-sm font-medium`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon size={18} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </Card>
      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          currentClient
            ? `${t('client:modal.edit')}: ${currentClient.name}`
            : t('client:modal.new')
        }
      >
        <CatalogForm
          fields={formFields}
          values={formValues}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={formErrors}
        />
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t('client:formDelete.title')}
        size="sm"
        footer={
          <>
            {/*  <Button
              variant="outline"
              onClick={handleCloseDeleteModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button> */}
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || (currentClient?.servicesCount || 0) > 0}
            >
              {isSubmitting
                ? t('client:formDelete.deleting')
                : t('client:formDelete.delete')}
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-gray-700 dark:text-gray-300">
            <Trans
              i18nKey="client:formDelete.message"
              values={{ client: currentClient?.name }}
            />
          </p>
          {/* {currentClient && currentClient.servicesCount > 0 && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-400">
                <span className="font-medium">Error:</span> Este cliente no se
                puede eliminar porque tiene {currentClient.servicesCount}{' '}
                servicio{currentClient.servicesCount !== 1 ? 's' : ''} asociado
                {currentClient.servicesCount !== 1 ? 's' : ''}.
              </p>
            </div>
          )} */}
        </div>
      </Modal>
    </div>
  )
}
