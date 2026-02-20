import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  FileText as FileIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from 'lucide-react'
import { CatalogForm } from '../../components/ui/CatalogForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Trans, useTranslation } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'
import { useStatusStore } from '@/utils/store/StatusStore.tsx'
import {
  createStatus,
  deleteStatus,
  updateStatus,
} from '@/services/catalogs/status.api.ts'

export interface StatusRecord {
  id?: string
  name: string
  description: string
  usedIn?: number
}

export interface StatusPayload {
  id?: string
  name: string
  description?: string
}

const initialValues: StatusPayload = {
  id: '',
  name: '',
  description: '',
}

export const StatusCatalog: React.FC = () => {
  const { t } = useTranslation(['common', 'status'])
  const { statuses, fetchStatuses } = useStatusStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<StatusRecord | null>(null)
  const [formValues, setFormValues] = useState<StatusPayload>(initialValues)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentStatus) {
      setFormValues({
        id: currentStatus.id,
        name: currentStatus.name,
        description: currentStatus.description || '',
      })
      return
    }

    setFormValues(initialValues)
  }, [currentStatus])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  const itemsPerPage = 5
  const totalPages = Math.max(1, Math.ceil(statuses.length / itemsPerPage))
  const paginatedStatuses = useMemo(
    () =>
      statuses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [statuses, currentPage]
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const handleOpenModal = (status?: StatusRecord) => {
    setCurrentStatus(status || null)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentStatus(null)
  }

  const handleOpenDeleteModal = (status: StatusRecord) => {
    setCurrentStatus(status)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentStatus(null)
  }

  const handleInputChange = (name: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formValues.name.trim()) {
      errors.name = 'El nombre es requerido'
    } else if (
      statuses.some(
        (status) =>
          status.name.toLowerCase() === formValues.name.toLowerCase() &&
          (!currentStatus || status.id !== currentStatus.id)
      )
    ) {
      errors.name = t('status:formNewStatus.createStatus')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      if (formValues.id) {
        const { status } = await updateStatus(formValues)
        if (status === 200) {
          toast.success('Estatus actualizado correctamente')
        }
      } else {
        const { id, ...payload } = formValues
        const status = await createStatus(payload)
        if (status.id) {
          toast.success('Estatus creado correctamente')
        }
      }

      setFormValues(initialValues)
      handleCloseModal()
      await fetchStatuses()
      setCurrentPage(1)
    } catch (error) {
      console.error(error)
      toast.error('No fue posible guardar el estatus')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentStatus?.id) return

    setIsSubmitting(true)
    try {
      const { status } = await deleteStatus(currentStatus.id)
      if (status === 200) {
        toast.success(t('status:formDelete.success'))
      }
      handleCloseDeleteModal()
      await fetchStatuses()
      setCurrentPage(1)
    } catch (error) {
      console.error(error)
      toast.error(t('status:formDelete.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const formFields = [
    {
      name: 'name',
      label: t('status:formNewStatus.nameInput'),
      type: 'text' as const,
      required: true,
      placeholder: t('status:formPlaceholder.nameInput'),
    },
    {
      name: 'description',
      label: t('status:formNewStatus.descriptionInput'),
      type: 'textarea' as const,
      placeholder: t('status:formPlaceholder.descriptionInput'),
    },
  ]

  return (
    <div>
      <Toaster />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('status:title')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('status:subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="default"
            icon={<PlusIcon size={16} />}
            onClick={() => handleOpenModal()}
          >
            {t('status:buttonNewStatus')}
          </Button>
        </div>
      </div>

      <Card className="py-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('status:table.columns.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('status:table.columns.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('status:table.columns.usedOn')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common:actions.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedStatuses.map((status) => (
                <tr
                  key={status.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {status.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {status.description || (
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        {t('status:table.noDescriptions')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <FileIcon size={12} className="mr-1" />
                        {status.usedIn ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(status)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Editar"
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(status)}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                          (status.usedIn || 0) > 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        title={
                          (status.usedIn || 0) > 0
                            ? t('status:table.deleteTitle')
                            : t('status:table.title')
                        }
                        disabled={(status.usedIn || 0) > 0}
                      >
                        <DeleteIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {statuses.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t('status:table.noData')}
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
                  {statuses.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                {t('common:table.a')}{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, statuses.length)}
                </span>{' '}
                {t('common:table.of')}{' '}
                <span className="font-medium">{statuses.length}</span>{' '}
                {t('common:actions.results_other')}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <ChevronLeftIcon size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  <ChevronRightIcon size={18} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          currentStatus
            ? `${t('status:formEditStatus.title')}: ${currentStatus.name}`
            : t('status:formNewStatus.title')
        }
      >
        <CatalogForm
          fields={formFields}
          values={formValues as unknown as Record<string, never>}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={formErrors}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t('status:formDelete.title')}
        size="sm"
        footer={
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting || (currentStatus?.usedIn || 0) > 0}
          >
            {isSubmitting
              ? t('status:formDelete.confirmButtonCancel')
              : t('status:formDelete.confirmButton')}
          </Button>
        }
      >
        <div className="py-4">
          <p className="text-gray-700 dark:text-gray-300">
            <Trans
              i18nKey="status:formDelete.message"
              values={{ status: currentStatus?.name }}
            />
          </p>
        </div>
      </Modal>
    </div>
  )
}
