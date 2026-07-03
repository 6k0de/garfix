import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CatalogForm } from '@/components/ui/CatalogForm'
import { Modal } from '@/components/ui/Modal'
import {
  createRole,
  deleteRole,
  updateRole,
} from '@/services/catalogs/role.api'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  PlusIcon,
  Trash2,
  UsersIcon,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useRoleStore } from '@/utils/store/RolesStore.tsx'
export interface Role {
  id?: string
  name: string
  description?: string
  usersCount?: number
}
export const RolesCatalog: React.FC = () => {
  const {roles, fetchRoles} = useRoleStore()
  const { t } = useTranslation(['commmon', 'roles'])

  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [formValues, setFormValues] = useState<Role>({
    id: '',
    name: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmiting, setIsSubmitign] = useState(false)
  useEffect(() => {
    if (currentRole) {
      setFormValues({
        id: currentRole.id,
        name: currentRole.name,
        description: currentRole.description || '',
      })
    } else {
      setFormValues({
        id: '',
        name: '',
        description: '',
      })
    }
  }, [currentRole])

  

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const itemsPerPage = 5
  const totalPages = Math.ceil(roles.length / itemsPerPage)
  const paginatedServices = roles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }
  const handleOpenModal = (role?: Role) => {
    setCurrentRole(role || null)
    setFormErrors({})
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentRole(null)
  }
  const handleOpenDeleteModal = (role: Role) => {
    setCurrentRole(role)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentRole(null)
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
      errors.name = 'El nombre es requerido'
    } else if (
      roles.some(
        (role) =>
          role.name.toLowerCase() === formValues.name.toLowerCase() &&
          (!currentRole || role.id !== currentRole.id)
      )
    ) {
      errors.name = 'Ya existe un rol con este nombre'
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
    //setIsSubmitign(true)
    if (formValues.id) {
      try {
        const uRole = await updateRole(formValues)
        console.log(uRole)
        if (uRole.status === 200) {
          toast.success(t('roles:message.successUpdate'))
          setFormValues({
            id: '',
            name: '',
            description: '',
          })
          handleCloseModal()
          await fetchRoles()
          setCurrentPage(1)
        }
      } catch (error) {
       toast.error(getApiErrorMessage(error, t('roles:message.errorUpdate')))
        console.error(error)
      }finally{
        setIsSubmitign(false)
      }
    } else {
      const { id, ...payload } = formValues
      console.log(payload)

      try {
        const role = await createRole(payload)
        console.log(role)
        if (role.id) {
          toast.success(t('roles:message.successCreate'))
          setFormValues({
            id: '',
            name: '',
            description: '',
          })
          handleCloseModal()
          await fetchRoles()
          setCurrentPage(1)
        }
      } catch (error) {
        console.error(error)
        toast.error(getApiErrorMessage(error, t('roles:message.errorCreate')))
      } finally {
        setIsSubmitign(false)
      }
    }
  }
  const handleDelete = async() => {
    if (!currentRole) return
    //setIsSubmitign(true)
    try {
      const deletRole = await deleteRole(currentRole?.id!)
      if(deletRole.status === 200){
        toast.success(t('roles:message.successDelete'))
        setFormValues({
          id: '',
          name: '',
          description: '',
        })
        handleCloseDeleteModal()
        await fetchRoles()
        setCurrentPage(1)
      }
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('roles:message.errorDelete')))
    }finally{
      setIsSubmitign(false)
    }
    
  }
  const formFields = [
    {
      name: 'name',
      label: currentRole
        ? t('roles:formEditRole.nameInput')
        : t('roles:formNewRoleLabel.title'),
      type: 'text' as const,
      required: true,
      placeholder: t('roles:formPlaceholder.nameInput'),
    },
    {
      name: 'description',
      label: currentRole
        ? t('roles:formEditRole.descriptionInput')
        : t('roles:formNewRoleLabel.descriptionInput'),
      type: 'textarea' as const,
      placeholder: t('roles:formPlaceholder.descriptionInput'),
    },
  ]

  return (
    <>
      <Toaster />
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {t('roles:title')}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('roles:subtitle')}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              variant="default"
              icon={<PlusIcon size={16} />}
              onClick={() => handleOpenModal()}
            >
              {t('roles:buttnNewRole')}
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
                    {t('roles:table.columns.name')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('roles:table.columns.description')}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {t('roles:table.columns.users')}
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
                {paginatedServices.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {role.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {role.description || (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          Sin descripción
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          <UsersIcon size={12} className="mr-1" />
                          {role.usersCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(role)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Editar"
                        >
                          <EditIcon size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(role)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      {t('roles:table.noData')}
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
                    {Math.min(currentPage * itemsPerPage, roles.length)}
                  </span>{' '}
                  {t('common:table.of')}{' '}
                  <span className="font-medium">{roles.length}</span>{' '}
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
            currentRole
              ? t('roles:formEditRole.title')
              : t('roles:formNewRoleLabel.title')
          }
        >
          <CatalogForm
            fields={formFields}
            values={formValues}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmiting}
            errors={formErrors}
          />
        </Modal>
        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          title={t('roles:formDelete.title')}
          size="md"
          footer={
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmiting}
              >
                {isSubmiting
                  ? t('roles:formDelete.confirmButtonCancel')
                  : t('roles:formDelete.confirmButton')}
              </Button>
            </>
          }
        >
          <div className="py-4">
            <p className="text-gray-700 dark:text-gray-300">
              <Trans
                i18nKey="roles:formDelete.message"
                values={{ role: currentRole?.name }}
                components={{ strong: <strong className="font-bold" /> }}
              />
            </p>
            {currentRole && currentRole?.usersCount! > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <span className="font-medium">
                    {t('roles:formDelete.titleWarning')}
                    <br />
                  </span>{' '}
                  <Trans
                    i18nKey="roles:formDelete.warningMessage"
                    values={{ number: currentRole?.usersCount }}
                    components={{ strong: <strong className="font-bold" /> }}
                  />
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </>
  )
}
