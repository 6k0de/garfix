import React, { useEffect, useState } from 'react'
import {
  PlusIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Building as BuildingIcon,
  MapPin as MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { CatalogForm } from '@/components/ui/CatalogForm'
import { Trans, useTranslation } from 'react-i18next'
import {
  createBranch,
  deleteBranch,
  updateBranch,
} from '@/services/catalogs/branch.api'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useBranchStore } from '@/utils/store/BranchesStore.tsx'
import { getAuthUser } from '@/lib/auth'
export interface Branch {
  id?: string
  name: string
  address: string
  clientsCount?: number | undefined
  technicCount?: number | undefined
}
export const Branches: React.FC = () => {
  const {branches, fetchBranches} = useBranchStore()
  const { t } = useTranslation(['common', 'branch'])
  const user = getAuthUser()
  const branchLimit = user?.company?.branchLimit ?? 0
  const usedBranches = branches.length
  const availableBranches = Math.max(0, branchLimit - usedBranches)
  const [currentPage, setCurrentPage] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null)
  const [formValues, setFormValues] = useState<Branch>({
    id: '',
    name: '',
    address: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  useEffect(() => {
    if (currentBranch) {
      setFormValues({
        id: currentBranch.id!,
        name: currentBranch.name,
        address: currentBranch.address,
      })
    } else {
      setFormValues({
        id: '',
        name: '',
        address: '',
      })
    }
  }, [currentBranch])

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  const itemsPerPage = 5
  const totalPages = Math.ceil(branches.length / itemsPerPage)
  const paginatedServices = branches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const handleOpenModal = (branch?: Branch) => {
    setCurrentBranch(branch || null)
    setFormErrors({})
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentBranch(null)
  }
  const handleOpenDeleteModal = (branch: Branch) => {
    setCurrentBranch(branch)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentBranch(null)
  }
  const handleInputChange = (name: string, value: string) => {
    setFormValues({
      ...formValues,
      [name]: value,
    })
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
      errors.name = t('branch:formBranch.validations.name')
    } else if (
      branches.some(
        (branch) =>
          branch.name.toLowerCase() === formValues.name.toLowerCase() &&
          (!currentBranch || branch.id !== currentBranch.id)
      )
    ) {
      errors.name = t('branch:formBranch.validations.nameExist')
    }
    if (!formValues.address.trim()) {
      errors.address = t('branch:formBranch.validations.address')
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
    if (formValues.id) {
      console.log(formValues)
      try {
        const uBranches = await updateBranch(formValues)
        console.log(uBranches)
        if (uBranches.status === 200) {
          toast.success(t('branch:message.successUpdate'))
          setFormValues({
            id: '',
            name: '',
            address: '',
          })
          handleCloseModal()
          await fetchBranches()
          setCurrentPage(1)
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err, t('branch:message.errorUpdate')))
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...payload } = formValues

      console.log(payload)
      try {
        const branch = await createBranch(payload)
        console.log(branch)
        if (branch.id) {
          toast.success(t('branch:message.successCreate'))
          setFormValues({
            id: '',
            name: '',
            address: '',
          })
          handleCloseModal()
          await fetchBranches()
          setCurrentPage(1)
        }
      } catch (error) {
        console.error(error)
        toast.error(getApiErrorMessage(error, t('branch:message.errorCreate')))
      } finally {
        setIsSubmitting(false)
      }
    }
  }
  const handleDelete = async () => {
    if (!currentBranch) return
    setIsSubmitting(true)
    console.log(currentBranch)
    try {
      const deletBranch = await deleteBranch(currentBranch?.id!)
      console.log(deletBranch)
      if (deletBranch.status === 200) {
        toast.success(t('branch:message.successDelete'))
        setFormValues({
          id: '',
          name: '',
          address: '',
        })
        handleCloseDeleteModal()
        await fetchBranches()
        setCurrentPage(1)
      }
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('branch:message.errorDelete')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const formFields = [
    {
      name: 'name',
      label: t('branch:formBranch.modalNewFields.name'),
      type: 'text' as const,
      required: true,
      placeholder: t('branch:formBranch.modalNewFields.namePlaceholder'),
    },
    {
      name: 'address',
      label: t('branch:formBranch.modalNewFields.address'),
      type: 'text' as const,
      required: true,
      placeholder: t('branch:formBranch.modalNewFields.addressPlaceholder'),
    },
  ]
  return (
    <>
      <Toaster />
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('branch:title')}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('branch:subtitle')}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Sucursales usadas: <span className="font-semibold">{usedBranches}</span> / {branchLimit}{' '}
              · Disponibles: <span className="font-semibold">{availableBranches}</span>
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              variant="default"
              icon={<PlusIcon size={16} />}
              onClick={() => handleOpenModal()}
            >
              {t('branch:addNewButton')}
            </Button>
          </div>
        </div>
        <Card className="py-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('branch:table.columns.name')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('branch:table.columns.address')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('branch:table.columns.clients')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('branch:table.columns.technics')}
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
                {paginatedServices.map((branch) => (
                  <tr
                    key={branch.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingIcon
                          size={18}
                          className="mr-2 text-indigo-500 dark:text-indigo-400"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {branch.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPinIcon
                          size={16}
                          className="mr-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {branch.address}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {branch.clientsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {branch.technicCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(branch)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Editar"
                        >
                          <EditIcon size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(branch)}
                          className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                            branch.clientsCount! > 0
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          title={
                            branch.clientsCount! > 0
                              ? 'No se puede eliminar porque tiene técnicos asignados'
                              : 'Eliminar'
                          }
                          disabled={branch?.clientsCount! > 0}
                        >
                          <DeleteIcon size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t('branch:table.noData')}
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
                    {Math.min(currentPage * itemsPerPage, branches.length)}
                  </span>{' '}
                  {t('common:table.of')}{' '}
                  <span className="font-medium">{branches.length}</span>{' '}
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
            currentBranch
              ? `${t('branch:modal.edit')}: ${currentBranch.name}`
              : t('branch:modal.new')
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
          title={t('branch:formDelete.title')}
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
                disabled={
                  isSubmitting || (currentBranch?.clientsCount || 0) > 0
                }
              >
                {isSubmitting
                  ? t('branch:formDelete.deleting')
                  : t('branch:formDelete.delete')}
              </Button>
            </>
          }
        >
          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-300">
              <Trans
                i18nKey="branch:formDelete.message"
                values={{ branch: currentBranch?.name }}
              />
            </p>
            {/* {currentBranch && currentBranch.clientsCount! > 0 && (
            <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-400">
                <span className="font-medium">Error:</span> Esta sucursal no se
                puede eliminar porque tiene {currentBranch.clientsCount} técnico
                {currentBranch.clientsCount !== 1 ? 's' : ''} asignado
                {currentBranch.clientsCount !== 1 ? 's' : ''}.
              </p>
            </div>
          )} */}
          </div>
        </Modal>
      </div>
    </>
  )
}
