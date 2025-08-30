import React, { useEffect, useState } from 'react'
import {
  PlusIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Building as BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { CatalogForm } from '../../components/ui/CatalogForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Trans, useTranslation } from 'react-i18next'
interface Location {
  id: number
  name: string
  branch: string
  instructions: string
}
export const LocationsCatalog: React.FC = () => {
  const { t } = useTranslation(['common', 'location', 'roles'])
  const [locations, setLocations] = useState<Location[]>([
    {
      id: 1,
      name: 'Mostrador',
      branch: 'Sucursal Principal',
      instructions: 'Ubicación para equipos recién recibidos',
    },
    {
      id: 2,
      name: 'Taller',
      branch: 'Sucursal Principal',
      instructions: 'Área de reparación principal',
    },
    {
      id: 3,
      name: 'Bodega',
      branch: 'Sucursal Principal',
      instructions: 'Almacenamiento de equipos y repuestos',
    },
    {
      id: 4,
      name: 'Vitrina',
      branch: 'Sucursal Principal',
      instructions: 'Equipos listos para entrega',
    },
    {
      id: 5,
      name: 'Mostrador',
      branch: 'Sucursal Norte',
      instructions: 'Recepción de equipos',
    },
    {
      id: 6,
      name: 'Taller',
      branch: 'Sucursal Norte',
      instructions: '',
    },
    {
      id: 7,
      name: 'Mostrador',
      branch: 'Sucursal Sur',
      instructions: 'Área de recepción y entrega',
    },
  ])
  const [currentPage, setCurrentPage] = useState(1)
  const branches = ['Sucursal Principal', 'Sucursal Norte', 'Sucursal Sur']
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [formValues, setFormValues] = useState({
    name: '',
    branch: '',
    instructions: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  useEffect(() => {
    if (currentLocation) {
      setFormValues({
        name: currentLocation.name,
        branch: currentLocation.branch,
        instructions: currentLocation.instructions,
      })
    } else {
      setFormValues({
        name: '',
        branch: '',
        instructions: '',
      })
    }
  }, [currentLocation])

  const itemsPerPage = 5
  const totalPages = Math.ceil(locations.length / itemsPerPage)
  const paginatedServices = locations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }
  const handleOpenModal = (location?: Location) => {
    setCurrentLocation(location || null)
    setFormErrors({})
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentLocation(null)
  }
  const handleOpenDeleteModal = (location: Location) => {
    setCurrentLocation(location)
    setIsDeleteModalOpen(true)
  }
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentLocation(null)
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
    if (!formValues.branch) {
      errors.branch = t('location:formNewLocationLabel.validateBranch')
    }
    if (!formValues.name.trim()) {
      errors.name = 'El nombre es requerido'
    } else if (
      locations.some(
        (location) =>
          location.name.toLowerCase() === formValues.name.toLowerCase() &&
          location.branch === formValues.branch &&
          (!currentLocation || location.id !== currentLocation.id)
      )
    ) {
      errors.name =
        t('location:formNewLocationLabel.validateBranchname')
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
      if (currentLocation) {
        // Update existing location
        setLocations(
          locations.map((location) =>
            location.id === currentLocation.id
              ? {
                  ...location,
                  name: formValues.name,
                  branch: formValues.branch,
                  instructions: formValues.instructions,
                }
              : location
          )
        )
      } else {
        // Create new location
        const newLocation: Location = {
          id: Math.max(0, ...locations.map((l) => l.id)) + 1,
          name: formValues.name,
          branch: formValues.branch,
          instructions: formValues.instructions,
        }
        setLocations([...locations, newLocation])
      }
      setIsSubmitting(false)
      handleCloseModal()
    }, 500)
  }
  const handleDelete = () => {
    if (!currentLocation) return
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setLocations(
        locations.filter((location) => location.id !== currentLocation.id)
      )
      setIsSubmitting(false)
      handleCloseDeleteModal()
    }, 500)
  }
  const formFields = [
    {
      name: 'branch',
      label: t('location:formNewLocationLabel.branchInput'),
      type: 'select' as const,
      required: true,
      options: branches.map((branch) => ({
        value: branch,
        label: branch,
      })),
    },
    {
      name: 'name',
      label: t('location:formNewLocationLabel.nameInput'),
      type: 'text' as const,
      required: true,
      placeholder: t('location:formPlaceholder.nameInput'),
    },
    {
      name: 'instructions',
      label: t('location:formNewLocationLabel.instructionsInput'),
      type: 'textarea' as const,
      placeholder: t('location:formPlaceholder.instructionsInput'),
    },
  ]
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('location:title')}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {t('location:subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="default"
            icon={<PlusIcon size={16} />}
            onClick={() => handleOpenModal()}
          >
            {t('location:buttonNewLocation')}
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
                  {t('location:table.columns.name')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('common:others.branch')}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {t('location:table.columns.instructions')}
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
              {paginatedServices.map((location) => (
                <tr
                  key={location.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {location.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BuildingIcon
                        size={16}
                        className="mr-1.5 text-gray-500 dark:text-gray-400"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {location.branch}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {location.instructions || (
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        {t('locations:table.noInstructions')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenModal(location)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        title="Editar"
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(location)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar"
                      >
                        <DeleteIcon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {t('location:table.noData')}
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
                  {Math.min(currentPage * itemsPerPage, locations.length)}
                </span>{' '}
                {t('common:table.of')}{' '}
                <span className="font-medium">{locations.length}</span>{' '}
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
          currentLocation
            ? `${t('location:formEditLocation.title')}${':'} ${
                currentLocation.name
              }`
            : t('location:formNewLocationLabel.title')
        }
        size="lg"
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
        title={t('location:formDelete.title')}
        size="md"
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
              disabled={isSubmitting}
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
              i18nKey="location:formDelete.message"
              values={{
                location: currentLocation?.name,
                branch: currentLocation?.branch,
              }}
            />
          </p>
        </div>
      </Modal>
    </div>
  )
}
