import React, { useEffect, useState } from 'react'
import {
  PlusIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  User as UserIcon,
  Mail as MailIcon,
  Building as BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { CatalogForm } from '@/components/ui/CatalogForm'
import { Trans, useTranslation } from 'react-i18next'
import { useBranchStore } from '@/utils/store/BranchesStore.tsx'
import { useRoleStore } from '@/utils/store/RolesStore.tsx'
import { useTechnicStore } from '@/utils/store/TechnicsStore.tsx'
import { createTechnic, deleteTechnic, updateTechnics } from '@/services/catalogs/technics.api.ts.ts'
import toast, { Toaster } from 'react-hot-toast'
export interface Technician {
  id?: string,
  name: string
  email?: string | undefined
  branchId?: string
  roleId?: string
  branch?: {
    id?: string
    name?: string
  }
  role?: {
    id?: string
    name?: string
  }
  serviceCount?: number | undefined
}
export const Technicians: React.FC = () => {
  const { branches, fetchBranches } = useBranchStore()
  const { roles, fetchRoles } = useRoleStore()
  const {technicians, fetchTechnics} = useTechnicStore()
  const { t } = useTranslation(['common', 'technic'])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentTechnician, setCurrentTechnician] = useState<Technician | null>(
    null
  )
  const [formValues, setFormValues] = useState<Technician>({
    id: '',
    name: '',
    email: '',
    roleId: '',
    branchId: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentTechnician) {
      setFormValues({
        id: currentTechnician.id!,
        name: currentTechnician.name,
        branchId: currentTechnician.branch?.id || currentTechnician.branchId || '',
        email: currentTechnician.email!,
        roleId: currentTechnician.role?.id || currentTechnician.roleId || '',
      })
    } else {
      setFormValues({
        name: '',
        branchId: '',
        email: '',
        roleId: '',
      })
    }
  }, [currentTechnician])

  useEffect(() => {
    fetchBranches()
    fetchRoles()
    fetchTechnics()
  }, [fetchBranches, fetchRoles, fetchTechnics])

  const itemsPerPage = 5
  const totalPages = Math.ceil(technicians.length / itemsPerPage)
  const paginatedServices = technicians.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const handleOpenModal = (technician?: Technician) => {
    setCurrentTechnician(technician || null)
    setFormErrors({})
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentTechnician(null)
  }
  const handleOpenDeleteModal = (technician: Technician) => {
    setCurrentTechnician(technician)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentTechnician(null)
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
      errors.name = t('technic:form.validations.name')
    }
    if (!formValues.branchId) {
      errors.branchId = t('technic:form.validations.branch')
    }
    if (!formValues.roleId) {
      errors.roleId = t('technic:form.validations.role')
    }
    return errors
  }
  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setIsSubmitting(true)
    console.log(formValues)
    if(formValues.id){
      console.log(formValues)
      try{
        const uTechnic = await updateTechnics(formValues)
        console.log(uTechnic)
        if(uTechnic.status === 200){
          toast.success(t('technic:message.successUpdate'))
          setFormValues({
            name: '',
            branchId: '',
            email: '',
            roleId: '',
          })
          handleCloseModal()
          await fetchTechnics()
          setCurrentPage(1)
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error){
        toast.error(t('technic:message.errorUpdate'))
      } finally {
        setIsSubmitting(false)
      }
    }else{
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {id, ...payload} = formValues

      console.log(payload)

      try{
        const technic = await createTechnic(payload)
        console.log(technic)
        if(technic.id){
          toast.success(t('technic:message.successCreate'))
          setFormValues({
            name: '',
            branchId: '',
            email: '',
            roleId: '',
          })
          handleCloseModal()
          await fetchTechnics()
          setCurrentPage(1)
        }
      } catch (error) {
        console.error(error)
        toast.error(t('technic:message.errorCreate'))
      }finally {
        setIsSubmitting(false)
      }
    }
  }
  const handleDelete = async() => {
    if (!currentTechnician) return
    setIsSubmitting(true)
    console.log(currentTechnician)
    try{
      const deletTechnic = await deleteTechnic(currentTechnician.id!)
      if(deletTechnic.status === 200){
        toast.success(t('technic:message.successDelete'))
        setFormValues({
          name: '',
          branchId: '',
          email: '',
          roleId: '',
        })
        handleCloseDeleteModal()
        await fetchTechnics()
        setCurrentPage(1)
      }
    } catch(error){
      console.error(error)
      toast.error(t('technic:message.errorDelete'))
    }finally {
      setIsSubmitting(false)
    }
  }

  const formFields = [
    {
      name: 'name',
      label: t('technic:form.formNewFields.name'),
      type: 'text' as const,
      required: true,
      placeholder: t('technic:form.formNewFields.namePlaceholder'),
    },
    {
      name: 'email',
      label: t('technic:form.formNewFields.email'),
      type: 'text' as const,
      placeholder: t('technic:form.formNewFields.emailPlaceholder'),
    },
    {
      name: 'branchId',
      label: t('technic:form.formNewFields.branch'),
      type: 'select' as const,
      required: true,
      options: branches.flatMap((branch) =>
        branch.id ? [{ value: branch.id, label: branch.name }] : []
      ),
    },
    {
      name: 'roleId',
      label: t('technic:form.formNewFields.role'),
      type: 'select' as const,
      required: true,
      options: roles.flatMap((rol) =>
        rol.id ? [{ value: rol.id, label: rol.name }] : []
      ),
    },
  ]

  return (
    <div>
      <Toaster />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('technic:title')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('technic:subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="default"
            icon={<PlusIcon size={16} />}
            onClick={() => handleOpenModal()}
          >
            {t('technic:newBotton')}
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
                  {t('technic:table.columns.technic')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('technic:table.columns.contact')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('technic:table.columns.numService')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('technic:table.columns.role')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('common:others.branch')}
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
              {paginatedServices.map((technician) => (
                <tr
                  key={technician.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <UserIcon
                          size={20}
                          className="text-indigo-600 dark:text-indigo-400"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {technician.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {technician.email && (
                        <div className="flex items-center">
                          <MailIcon
                            size={14}
                            className="mr-1.5 text-gray-500 dark:text-gray-400"
                          />
                          <span>{technician.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {technician.serviceCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                       {technician.role?.name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BuildingIcon
                        size={16}
                        className="mr-1.5 text-gray-500 dark:text-gray-400"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {technician.branch?.name ?? '—'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(technician)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Editar"
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(technician)}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                          technician.serviceCount! > 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        title={
                          technician.serviceCount! > 0
                            ? 'No se puede eliminar porque tiene servicios asignados'
                            : 'Eliminar'
                        }
                        disabled={technician.serviceCount! > 0}
                      >
                        <DeleteIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {technicians.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t('technic:table.noData')}
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
                  {Math.min(currentPage * itemsPerPage, technicians.length)}
                </span>{' '}
                {t('common:table.of')}{' '}
                <span className="font-medium">{technicians.length}</span>{' '}
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
          currentTechnician
            ? `Editar Técnico: ${currentTechnician.name}`
            : 'Nuevo Técnico'
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t('technic:formDelete.title')}
        size="sm"
        footer={
          <>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                isSubmitting || (currentTechnician?.serviceCount || 0) > 0
              }
            >
              {isSubmitting
                ? t('technic:formDelete.deleting')
                : t('technic:formDelete.delete')}
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-gray-700 dark:text-gray-300">
            <Trans
              i18nKey="technic:formDelete.message"
              values={{ technic: currentTechnician?.name }}
            />
          </p>
        </div>
      </Modal>
    </div>
  )
}
