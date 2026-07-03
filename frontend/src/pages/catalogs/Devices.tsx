import React, { useEffect, useState } from 'react'
import {
  PlusIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Smartphone as DeviceIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { CatalogForm } from '@/components/ui/CatalogForm'
import { Trans, useTranslation } from 'react-i18next'
import { useDevicesStore } from '@/utils/store/DevicesStore.tsx'
import { createDevice, deleteDevice, updateDevice } from '@/services/catalogs/device.api.ts'
import toast, {Toaster} from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useActiveBranchId } from '@/lib/useActiveBranchId'
export interface DeviceType {
  id?: string
  name: string
  description: string
  devicesCount?: number
}
export const DevicesCatalog: React.FC = () => {
  const { deviceTypes, fetchDevices } = useDevicesStore()
  const { t } = useTranslation(['common', 'device', 'roles'])
  const activeBranchId = useActiveBranchId()

  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentDeviceType, setCurrentDeviceType] = useState<DeviceType | null>(
    null
  )
  const [formValues, setFormValues] = useState({
    id: '',
    name: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  useEffect(() => {
    if (currentDeviceType) {
      setFormValues({
        id: currentDeviceType.id!,
        name: currentDeviceType.name,
        description: currentDeviceType.description,
      })
    } else {
      setFormValues({
        id: '',
        name: '',
        description: '',
      })
    }
  }, [currentDeviceType])

  useEffect(() => {
    setCurrentPage(1)
    setIsModalOpen(false)
    setIsDeleteModalOpen(false)
    setCurrentDeviceType(null)
    if (!activeBranchId) return
    void fetchDevices()
  }, [activeBranchId, fetchDevices])

  const itemsPerPage = 5
  const totalPages = Math.ceil(deviceTypes.length / itemsPerPage)
  console.log(deviceTypes)
  const paginatedServices = deviceTypes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }
  const handleOpenModal = (deviceType?: DeviceType) => {
    setCurrentDeviceType(deviceType || null)
    setFormErrors({})
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentDeviceType(null)
  }
  const handleOpenDeleteModal = (deviceType: DeviceType) => {
    setCurrentDeviceType(deviceType)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentDeviceType(null)
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
      errors.name = t('device:validations.name')
    } else if (
      deviceTypes.some(
        (deviceType) =>
          deviceType.name.toLowerCase() === formValues.name.toLowerCase() &&
          (!currentDeviceType || deviceType.id !== currentDeviceType.id)
      )
    ) {
      errors.name = t('device:formNewDevice.validateName')
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
    if(formValues.id){
      try{
        const uDevice = await updateDevice(formValues)
        if(uDevice.status === 200) {
          toast.success(t('device:message.successUpdate'))
          setFormValues({
            id: '',
            name: '',
            description: '',
          })
          handleCloseModal()
          await fetchDevices()
          setCurrentPage(1)
        }
      } catch(error) {
        console.error(error)
        toast.error(getApiErrorMessage(error, t('device:message.errorUpdate')))
      } finally{
        setIsSubmitting(false)
      }
    }else{
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {id, ...payload} = formValues

      try{
        const device = await createDevice(payload)
        if(device.id){
          toast.success(t('device:message.successCreate'))
          setFormValues({
            id: '',
            name: '',
            description: '',
          })
          handleCloseModal()
          await fetchDevices()
          setCurrentPage(1)
        }
      }catch (error){
        console.error(error)
        toast.error(getApiErrorMessage(error, t('device:message.errorCreate')))
      }finally{
        setIsSubmitting(false)
      }
    }
  }
  const handleDelete = async() => {
    if (!currentDeviceType) return
    setIsSubmitting(true)
    try{
      const deletDevice = await deleteDevice(currentDeviceType.id!)
      if(deletDevice.status === 200) {
        toast.success(t('device:message.successDelete'))
        setFormValues({
          id: '',
          name: '',
          description: '',
        })
        handleCloseDeleteModal()
        await fetchDevices()
        setCurrentPage(1)
      }
    }catch (error){
      console.error(error)
      toast.error(getApiErrorMessage(error, t('device:message.errorDelete')))
    }finally {
      setIsSubmitting(false)
    }

  }
  const formFields = [
    {
      name: 'name',
      label: t('device:formNewDevice.nameInput'),
      type: 'text' as const,
      required: true,
      placeholder: t('device:formPlaceholder.nameInput'),
    },
    {
      name: 'description',
      label: t('device:formNewDevice.descriptionInput'),
      type: 'textarea' as const,
      placeholder: t('device:formPlaceholder.descriptionInput'),
    },
  ]
  return (
    <div>
      <Toaster />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('device:title')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('device:subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="default"
            icon={<PlusIcon size={16} />}
            onClick={() => handleOpenModal()}
          >
            {t('device:buttonNewDevice')}
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
                  {t('device:table.columns.name')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('device:table.columns.description')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('common:others.device')}
                </th>
               {/*  <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('device:table.columns.isActive')}
                </th> */}
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('common:actions.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedServices.map((deviceType) => (
                <tr
                  key={deviceType.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {deviceType.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {deviceType.description || (
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        {t('device:table.noDescription')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <DeviceIcon size={12} className="mr-1" />
                        {deviceType.devicesCount ?? 0}
                      </span>
                    </div>
                  </td>
                {/*   <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          deviceType.active === true
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        } dark:bg-indigo-900/30 dark:text-indigo-400`}
                      >
                        {deviceType.active === true ? 'Si' : 'No'}
                      </span>
                    </div>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(deviceType)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Editar"
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(deviceType)}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                          (deviceType.devicesCount ?? 0) > 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        title={
                          (deviceType.devicesCount ?? 0) > 0
                            ? 'No se puede eliminar porque está en uso'
                            : 'Eliminar'
                        }
                        disabled={(deviceType.devicesCount ?? 0) > 0}
                      >
                        <DeleteIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {deviceTypes.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t('device:table.noData')}
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
                  {Math.min(currentPage * itemsPerPage, deviceTypes.length)}
                </span>{' '}
                {t('common:table.of')}{' '}
                <span className="font-medium">{deviceTypes.length}</span>{' '}
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
          currentDeviceType
            ? `${t('device:formEditDevice.title')}: ${currentDeviceType.name}`
            : t('device:formNewDevice.title')
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
        title={t('device:formDelete.title')}
        size="md"
        footer={
          <>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                isSubmitting || (currentDeviceType?.devicesCount || 0) > 0
              }
            >
              {isSubmitting
                ? t('roles:formDelete.confirmButtonCancel')
                : t('roles:formDelete.confirmButton')}
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-gray-700 dark:text-gray-300">
            <Trans 
              i18nKey='device:formDelete.message'
              values={{device: currentDeviceType?.name}}
            />
          </p>
        </div>
      </Modal>
    </div>
  )
}
