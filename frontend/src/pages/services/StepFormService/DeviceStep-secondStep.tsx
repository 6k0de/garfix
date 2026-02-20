import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  DollarSignIcon,
  PlusIcon,
  SmartphoneIcon,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ServiceCatalogsResponse,
  ServiceDeviceFormValue,
  ServiceFormData,
} from '../service.types'

const buildEmptyDevice = (
  catalogs: ServiceCatalogsResponse,
  branchId: string
): ServiceDeviceFormValue => {
  const techniciansByBranch = catalogs.technicians.filter(
    (technician) => !technician.branchId || technician.branchId === branchId
  )
  const locationsByBranch = catalogs.locations.filter(
    (location) => location.branchId === branchId
  )

  return {
    id: `tmp-${Date.now()}`,
    deviceTypeId: catalogs.deviceTypes[0]?.id || '',
    brand: '',
    model: '',
    serialNumber: '',
    color: '',
    appearance: '',
    problem: '',
    solution: '',
    cost: '',
    advance: '',
    technicianId:
      techniciansByBranch[0]?.id || catalogs.technicians[0]?.id || '',
    locationId: locationsByBranch[0]?.id || catalogs.locations[0]?.id || '',
    deliveryDate: '',
    deliveryTime: '',
  }
}

interface DeviceStepProps {
  formData: ServiceFormData
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>
  nextStep: () => void
  prevStep: () => void
  catalogs: ServiceCatalogsResponse
}

export const DeviceStep: React.FC<DeviceStepProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  catalogs,
}) => {
  const { t } = useTranslation(['common', 'services'])

  const [devices, setDevices] = useState<ServiceDeviceFormValue[]>(
    formData.devices || []
  )
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [isEditingDevice, setIsEditingDevice] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAddingDevice, setIsAddingDevice] = useState(devices.length === 0)
  const [currentDevice, setCurrentDevice] = useState<ServiceDeviceFormValue>(
    buildEmptyDevice(catalogs, formData.serviceDetails.branchId)
  )

  const deviceTypeNameById = useMemo(
    () =>
      new Map(
        catalogs.deviceTypes.map((deviceType) => [deviceType.id, deviceType.name] as const)
      ),
    [catalogs.deviceTypes]
  )

  const technicianNameById = useMemo(
    () =>
      new Map(
        catalogs.technicians.map((technician) => [technician.id, technician.name] as const)
      ),
    [catalogs.technicians]
  )

  const locationNameById = useMemo(
    () =>
      new Map(catalogs.locations.map((location) => [location.id, location.name] as const)),
    [catalogs.locations]
  )

  const techniciansByBranch = useMemo(
    () =>
      catalogs.technicians.filter(
        (technician) =>
          !technician.branchId ||
          technician.branchId === formData.serviceDetails.branchId
      ),
    [catalogs.technicians, formData.serviceDetails.branchId]
  )

  const locationsByBranch = useMemo(
    () =>
      catalogs.locations.filter(
        (location) => location.branchId === formData.serviceDetails.branchId
      ),
    [catalogs.locations, formData.serviceDetails.branchId]
  )

  const visibleTechnicians =
    techniciansByBranch.length > 0 ? techniciansByBranch : catalogs.technicians
  const visibleLocations =
    locationsByBranch.length > 0 ? locationsByBranch : catalogs.locations

  const handleDeviceChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target
    setCurrentDevice((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev }
        delete nextErrors[name]
        return nextErrors
      })
    }
  }

  const validateDevice = () => {
    const nextErrors: Record<string, string> = {}
    if (!currentDevice.deviceTypeId) {
      nextErrors.deviceTypeId = t(
        'services:second-step.newDevice.validations.typeDevice'
      )
    }
    if (!currentDevice.brand.trim()) {
      nextErrors.brand = t('services:second-step.newDevice.validations.brandDevice')
    }
    if (!currentDevice.model.trim()) {
      nextErrors.model = t('services:second-step.newDevice.validations.modelDevice')
    }
    if (!currentDevice.appearance) {
      nextErrors.appearance = t(
        'services:second-step.newDevice.validations.appearanceDevice'
      )
    }
    if (!currentDevice.problem.trim()) {
      nextErrors.problem = t(
        'services:second-step.newDevice.validations.detailDevice'
      )
    }
    if (!currentDevice.cost.trim()) {
      nextErrors.cost = t('services:second-step.newDevice.validations.costRepair')
    } else if (Number.isNaN(Number(currentDevice.cost))) {
      nextErrors.cost = t(
        'services:second-step.newDevice.validations.costRepairInvalid'
      )
    }
    if (currentDevice.advance && Number.isNaN(Number(currentDevice.advance))) {
      nextErrors.advance = 'El anticipo debe ser numérico'
    }
    if (!currentDevice.technicianId) {
      nextErrors.technicianId = 'Selecciona un técnico'
    }
    if (!currentDevice.locationId) {
      nextErrors.locationId = 'Selecciona una ubicación'
    }
    return nextErrors
  }

  const resetCurrentDevice = () => {
    setCurrentDevice(buildEmptyDevice(catalogs, formData.serviceDetails.branchId))
    setEditIndex(null)
    setIsEditingDevice(false)
  }

  const handleAddDevice = () => {
    const validationErrors = validateDevice()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const normalizedDevice: ServiceDeviceFormValue = {
      ...currentDevice,
      id: editIndex !== null ? currentDevice.id : `tmp-${Date.now()}`,
    }

    let nextDevices: ServiceDeviceFormValue[]
    if (editIndex !== null) {
      nextDevices = devices.map((device, index) =>
        index === editIndex ? normalizedDevice : device
      )
    } else {
      nextDevices = [...devices, normalizedDevice]
    }

    setDevices(nextDevices)
    setFormData((prev) => ({
      ...prev,
      devices: nextDevices,
    }))
    setErrors({})
    setIsAddingDevice(false)
    resetCurrentDevice()
  }

  const handleEditDevice = (index: number) => {
    setCurrentDevice(devices[index])
    setEditIndex(index)
    setIsEditingDevice(true)
    setIsAddingDevice(true)
    setErrors({})
  }

  const handleDeleteDevice = (index: number) => {
    const nextDevices = devices.filter((_, deviceIndex) => deviceIndex !== index)
    setDevices(nextDevices)
    setFormData((prev) => ({
      ...prev,
      devices: nextDevices,
    }))
    setErrors({})
    setIsAddingDevice(nextDevices.length === 0)
    resetCurrentDevice()
  }

  const handleContinue = () => {
    if (devices.length === 0) {
      setErrors({
        general: 'Por favor agrega al menos un dispositivo',
      })
      return
    }
    if (isAddingDevice) {
      setErrors({
        general:
          'Por favor guarda o cancela el dispositivo actual antes de continuar',
      })
      return
    }
    setErrors({})
    nextStep()
  }

  return (
    <div className="animate-fadeIn">
      {devices.length > 0 && !isAddingDevice && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            {t('services:second-step.title')}
          </h2>
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('services:second-step.subtitle')} ({devices.length})
          </h3>

          {errors.general && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <div className="space-y-3">
            {devices.map((device, index) => (
              <Card key={device.id || index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-4">
                      <SmartphoneIcon
                        size={28}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {device.brand} {device.model}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {deviceTypeNameById.get(device.deviceTypeId) || 'Sin tipo'} •{' '}
                        {device.serialNumber || 'Sin número de serie'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-medium">Problema:</span> {device.problem}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          ${device.cost || '0'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {technicianNameById.get(device.technicianId) || 'Sin técnico'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          {locationNameById.get(device.locationId) || 'Sin ubicación'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditDevice(index)}
                      className="p-1 text-indigo-500 dark:text-indigo-300"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(index)}
                      className="p-1 text-red-500 dark:text-red-300"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-4"
            icon={<PlusIcon size={16} />}
            onClick={() => {
              setIsAddingDevice(true)
              setIsEditingDevice(false)
              resetCurrentDevice()
            }}
          >
            {t('services:second-step.buttonAddMoreDevice')}
          </Button>
        </div>
      )}

      {devices.length === 0 && !isAddingDevice && (
        <div className="mb-6 flex justify-center">
          <div className="flex flex-col items-center justify-center w-full max-w-md p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
            <SmartphoneIcon
              size={48}
              className="text-gray-400 dark:text-gray-500 mb-4"
            />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-6 text-center">
              {t('services:second-step.message.noDevice')}
            </p>
            <Button
              variant="default"
              size="lg"
              icon={<PlusIcon size={20} />}
              onClick={() => {
                setIsAddingDevice(true)
                resetCurrentDevice()
              }}
            >
              {t('services:second-step.buttonAddDevice')}
            </Button>
          </div>
        </div>
      )}

      {isAddingDevice && (
        <Card className="p-6 mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {isEditingDevice
              ? t('services:second-step.newDevice.titleEdit')
              : t('services:second-step.newDevice.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="deviceTypeId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLabelTypeDevice')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <Select
                value={currentDevice.deviceTypeId}
                onValueChange={(value) =>
                  handleDeviceChange({
                    target: { name: 'deviceTypeId', value },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <SelectTrigger
                  className={`bg-white dark:bg-gray-800 w-full py-4.5 border ${
                    errors.deviceTypeId
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                  } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                >
                  <SelectValue
                    placeholder={t(
                      'services:second-step.newDevice.placeholder.newTypeDeviceInput'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {catalogs.deviceTypes.map((deviceType) => (
                    <SelectItem key={deviceType.id} value={deviceType.id}>
                      {deviceType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deviceTypeId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.deviceTypeId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLabelBrand')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                className={`bg-white dark:bg-gray-800 block w-full py-2 px-3 border ${
                  errors.brand
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder={t(
                  'services:second-step.newDevice.placeholder.newBrandInput'
                )}
                value={currentDevice.brand}
                onChange={handleDeviceChange}
              />
              {errors.brand && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.brand}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="model"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLabelModel')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="model"
                name="model"
                className={`bg-white dark:bg-gray-800 block w-full py-2 px-3 border ${
                  errors.model
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder={t(
                  'services:second-step.newDevice.placeholder.newModelInput'
                )}
                value={currentDevice.model}
                onChange={handleDeviceChange}
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.model}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="serialNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLabelSerialNumber')}
              </label>
              <input
                type="text"
                id="serialNumber"
                name="serialNumber"
                className="bg-white dark:bg-gray-800 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t(
                  'services:second-step.newDevice.placeholder.newSerialNumberInput'
                )}
                value={currentDevice.serialNumber}
                onChange={handleDeviceChange}
              />
            </div>

            <div>
              <label
                htmlFor="color"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLabelColor')}
              </label>
              <input
                type="text"
                id="color"
                name="color"
                className="bg-white dark:bg-gray-800 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t(
                  'services:second-step.newDevice.placeholder.newColorInput'
                )}
                value={currentDevice.color}
                onChange={handleDeviceChange}
              />
            </div>

            <div>
              <label
                htmlFor="appearance"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLabelAppearance')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="appearance"
                name="appearance"
                className={`bg-white dark:bg-gray-800 block w-full py-2 px-3 border ${
                  errors.appearance
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder={t(
                  'services:second-step.newDevice.placeholder.newAppearanceInput'
                )}
                value={currentDevice.appearance}
                onChange={handleDeviceChange}
              />
              {errors.appearance && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.appearance}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="problem"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLabelServiceDetail')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="problem"
                name="problem"
                rows={3}
                className={`bg-white dark:bg-gray-800 block w-full py-2 px-3 border ${
                  errors.problem
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder={t(
                  'services:second-step.newDevice.placeholder.newServiceDetailInput'
                )}
                value={currentDevice.problem}
                onChange={handleDeviceChange}
              />
              {errors.problem && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.problem}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="solution"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLabelSolutionDetail')}
              </label>
              <textarea
                id="solution"
                name="solution"
                rows={3}
                className="bg-white dark:bg-gray-800 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={t(
                  'services:second-step.newDevice.placeholder.newSolutionDetailInput'
                )}
                value={currentDevice.solution}
                onChange={handleDeviceChange}
              />
            </div>

            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newCostRepair')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSignIcon size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="cost"
                  name="cost"
                  className={`bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border ${
                    errors.cost
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                  } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="0.00"
                  value={currentDevice.cost}
                  onChange={handleDeviceChange}
                />
              </div>
              {errors.cost && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cost}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="advance"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newAdvance')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSignIcon size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="advance"
                  name="advance"
                  className={`bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border ${
                    errors.advance
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                  } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="0.00"
                  value={currentDevice.advance}
                  onChange={handleDeviceChange}
                />
              </div>
              {errors.advance && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.advance}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="technicianId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newAssignedTechnician')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <Select
                value={currentDevice.technicianId}
                onValueChange={(value) =>
                  handleDeviceChange({
                    target: { name: 'technicianId', value },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <SelectTrigger
                  className={`bg-white dark:bg-gray-800 w-full py-4.5 border ${
                    errors.technicianId
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                  } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                >
                  <SelectValue
                    placeholder={t(
                      'services:second-step.newDevice.placeholder.newAssignedTechnicianInput'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {visibleTechnicians.map((technician) => (
                    <SelectItem key={technician.id} value={technician.id}>
                      {technician.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.technicianId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.technicianId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="locationId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newLocation')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <Select
                value={currentDevice.locationId}
                onValueChange={(value) =>
                  handleDeviceChange({
                    target: { name: 'locationId', value },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <SelectTrigger
                  className={`bg-white dark:bg-gray-800 w-full py-4.5 border ${
                    errors.locationId
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-700'
                  } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                >
                  <SelectValue
                    placeholder={t(
                      'services:second-step.newDevice.placeholder.newAssignedLocationInput'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {visibleLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.locationId}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="deliveryDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newEstimateDate')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="deliveryDate"
                  name="deliveryDate"
                  className="bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={currentDevice.deliveryDate}
                  onChange={handleDeviceChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="deliveryTime"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:second-step.newDevice.labelInput.newEstimateTime')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockIcon size={18} className="text-gray-400" />
                </div>
                <input
                  type="time"
                  id="deliveryTime"
                  name="deliveryTime"
                  className="bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={currentDevice.deliveryTime}
                  onChange={handleDeviceChange}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center">
            <Button
              variant="outline"
              className="mr-3"
              onClick={() => {
                setIsAddingDevice(false)
                setErrors({})
                resetCurrentDevice()
              }}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="secondary"
              onClick={handleAddDevice}
              icon={<PlusIcon size={16} />}
            >
              {isEditingDevice
                ? t('services:second-step.newDevice.titleEdit')
                : t('services:second-step.newDevice.title')}
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          icon={<ChevronLeftIcon size={16} />}
        >
          {t('common:actions.previous')}
        </Button>
        <Button variant="default" onClick={handleContinue}>
          {t('common:actions.continue')}
        </Button>
      </div>
    </div>
  )
}
