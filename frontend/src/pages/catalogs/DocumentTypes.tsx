import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  FileText as FileIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from 'lucide-react'
import { CatalogForm } from '@/components/ui/CatalogForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Trans, useTranslation } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useDocumentTypesStore } from '@/utils/store/DocumentTypesStore.tsx'
import {
  createDocumentType,
  deleteDocumentType,
  updateDocumentType,
} from '@/services/catalogs/documentType.api.ts'
import { useActiveBranchId } from '@/lib/useActiveBranchId'

export interface DocumentTypeRecord {
  id?: string
  name: string
  description: string
  usedIn?: number
}

export interface DocumentTypePayload {
  id?: string
  name: string
  description?: string
}

const initialValues: DocumentTypePayload = {
  id: '',
  name: '',
  description: '',
}

export const DocumentTypesCatalog: React.FC = () => {
  const { t } = useTranslation(['common', 'documentType'])
  const { documentTypes, fetchDocumentTypes } = useDocumentTypesStore()
  const activeBranchId = useActiveBranchId()

  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentDocumentType, setCurrentDocumentType] = useState<DocumentTypeRecord | null>(null)
  const [formValues, setFormValues] = useState<DocumentTypePayload>(initialValues)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentDocumentType) {
      setFormValues({
        id: currentDocumentType.id,
        name: currentDocumentType.name,
        description: currentDocumentType.description || '',
      })
      return
    }

    setFormValues(initialValues)
  }, [currentDocumentType])

  useEffect(() => {
    setCurrentPage(1)
    setIsModalOpen(false)
    setIsDeleteModalOpen(false)
    setCurrentDocumentType(null)
    if (!activeBranchId) return
    void fetchDocumentTypes()
  }, [activeBranchId, fetchDocumentTypes])

  const itemsPerPage = 5
  const totalPages = Math.max(1, Math.ceil(documentTypes.length / itemsPerPage))
  const paginatedDocumentTypes = useMemo(
    () =>
      documentTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [documentTypes, currentPage]
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const handleOpenModal = (documentType?: DocumentTypeRecord) => {
    setCurrentDocumentType(documentType || null)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentDocumentType(null)
  }

  const handleOpenDeleteModal = (documentType: DocumentTypeRecord) => {
    setCurrentDocumentType(documentType)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentDocumentType(null)
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
      errors.name = t('documentType:form.validations.name')
    } else if (
      documentTypes.some(
        (documentType) =>
          documentType.name.toLowerCase() === formValues.name.toLowerCase() &&
          (!currentDocumentType || documentType.id !== currentDocumentType.id)
      )
    ) {
      errors.name = t('documentType:form.validations.duplicated')
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
        const { status } = await updateDocumentType(formValues)
        if (status === 200) {
          toast.success(t('documentType:messages.updateSuccess'))
        }
      } else {
        const { id, ...payload } = formValues
        const documentType = await createDocumentType(payload)
        if (documentType.id) {
          toast.success(t('documentType:messages.createSuccess'))
        }
      }

      setFormValues(initialValues)
      handleCloseModal()
      await fetchDocumentTypes()
      setCurrentPage(1)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('documentType:messages.saveError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentDocumentType?.id) return

    setIsSubmitting(true)
    try {
      const { status } = await deleteDocumentType(currentDocumentType.id)
      if (status === 200) {
        toast.success(t('documentType:messages.deleteSuccess'))
      }
      handleCloseDeleteModal()
      await fetchDocumentTypes()
      setCurrentPage(1)
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('documentType:messages.deleteError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const formFields = [
    {
      name: 'name',
      label: t('documentType:form.fields.name'),
      type: 'text' as const,
      required: true,
      placeholder: t('documentType:form.placeholders.name'),
    },
    {
      name: 'description',
      label: t('documentType:form.fields.description'),
      type: 'textarea' as const,
      placeholder: t('documentType:form.placeholders.description'),
    },
  ]

  return (
    <div>
      <Toaster />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('documentType:title')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('documentType:subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="default"
            icon={<PlusIcon size={16} />}
            onClick={() => handleOpenModal()}
          >
            {t('documentType:newButton')}
          </Button>
        </div>
      </div>

      <Card className="py-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('documentType:table.columns.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('documentType:table.columns.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('documentType:table.columns.usedOn')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common:actions.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedDocumentTypes.map((documentType) => (
                <tr
                  key={documentType.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {documentType.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {documentType.description || (
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        {t('documentType:table.noDescriptions')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <FileIcon size={12} className="mr-1" />
                        {documentType.usedIn ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(documentType)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title={t('common:actions.edit')}
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(documentType)}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${(documentType.usedIn || 0) > 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        title={
                          (documentType.usedIn || 0) > 0
                            ? t('documentType:table.deleteBlockedTitle')
                            : t('common:actions.delete')
                        }
                        disabled={(documentType.usedIn || 0) > 0}
                      >
                        <DeleteIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {documentTypes.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t('documentType:table.noData')}
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
                {Math.min(currentPage * itemsPerPage, documentTypes.length)}
              </span>{' '}
              {t('common:table.of')}{' '}
              <span className="font-medium">{documentTypes.length}</span>{' '}
              {t('common:actions.results_other')}
            </p>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() =>
                  handlePageChange(Math.max(1, currentPage - 1))
                }
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${currentPage === 1
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
                  className={`relative inline-flex items-center px-4 py-2 border ${page === currentPage
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
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${currentPage === totalPages
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={formValues.id ? t('documentType:modal.editTitle') : t('documentType:modal.newTitle')}
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t('documentType:deleteModal.title')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <Trans
              i18nKey="documentType:deleteModal.message"
              values={{ documentType: currentDocumentType?.name }}
              components={{ strong: <strong className="font-semibold" /> }}
            />
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={handleCloseDeleteModal}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting
                ? t('documentType:deleteModal.deletingButton')
                : t('documentType:deleteModal.deleteButton')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
