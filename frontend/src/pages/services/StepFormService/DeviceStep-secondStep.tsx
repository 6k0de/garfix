import { Button } from '@/components/ui/button'
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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export const DeviceStep: React.FC<{
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  nextStep: () => void
  prevStep: () => void
}> = ({ formData, setFormData, nextStep, prevStep }) => {
  const { t } = useTranslation(['common', 'services'])

  const [devices, setDevices] = useState(formData.devices || [])
  const [editIndex, setEditIndex] = useState<number | null>(null)

  const [isEditingDevice, setIsEditingDevice] = useState<boolean>(false)
  const [currentDevice, setCurrentDevice] = useState({
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    color: '',
    condition: '',
    problem: '',
    solution: '',
    cost: '',
    advance: '',
    technician: '',
    location: '',
    deliveryDate: '',
    deliveryTime: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isAddingDevice, setIsAddingDevice] = useState(devices.length === 0)
  const deviceTypes = [
    'Smartphone',
    'Tablet',
    'Laptop',
    'PC',
    'Impresora',
    'Otro',
  ]

  const technicians = ['Juan Méndez', 'María López', 'Carlos Rodríguez']
  const locations = ['Mostrador', 'Taller', 'Bodega']
  const conditionOptions = ['Nuevo', 'Excelente', 'Bueno', 'Regular', 'Malo']
  const handleDeviceChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setCurrentDevice({
      ...currentDevice,
      [name]: value,
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
  const validateDevice = () => {
    const newErrors: Record<string, string> = {}
    if (!currentDevice.type)
      newErrors.type = t(
        'services:second-step.newDevice.validations.typeDevice'
      )
    if (!currentDevice.brand)
      newErrors.brand = t(
        'services:second-step.newDevice.validations.brandDevice'
      )
    if (!currentDevice.model)
      newErrors.model = t(
        'services:second-step.newDevice.validations.modelDevice'
      )
    if (!currentDevice.condition) {
      newErrors.condition = t(
        'services:second-step.newDevice.validations.appearanceDevice'
      )
    }
    if (!currentDevice.problem)
      newErrors.problem = t(
        'services:second-step.newDevice.validations.detailDevice'
      )
    if (!currentDevice.cost) {
      newErrors.cost = t(
        'services:second-step.newDevice.validations.costRepair'
      )
    } else if (isNaN(Number(currentDevice.cost))) {
      newErrors.cost = t(
        'services:second-step.newDevice.validations.costRepairInvalid'
      )
    }
    return newErrors
  }
  const handleAddDevice = () => {
    const validationErrors = validateDevice()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    let newDevices: typeof devices
    if (editIndex !== null) {
      newDevices = devices.map((d: { id: any }, i: number) =>
        i === editIndex ? { ...currentDevice, id: d.id } : d
      )
    } else {
      newDevices = [
        ...devices,
        {
          ...currentDevice,
          id: Date.now(),
        },
      ]
    }

    setDevices(newDevices)
    setFormData({
      ...formData,
      devices: newDevices,
    })
    setCurrentDevice({
      type: '',
      brand: '',
      model: '',
      serialNumber: '',
      color: '',
      condition: '',
      problem: '',
      solution: '',
      cost: '',
      advance: '',
      technician: '',
      location: '',
      deliveryDate: '',
      deliveryTime: '',
    })
    setEditIndex(null)
    setErrors({})
    setIsAddingDevice(false)
  }

  const handleEditDevice = (index: number) => {
    setCurrentDevice(devices[index])
    setIsAddingDevice(true)
    setIsEditingDevice(true)
    setEditIndex(index)
  }
  const handleDeleteDevice = (index: number) => {
    const newDevices = devices.filter((_: any, i: number) => i !== index)
    setDevices(newDevices)
    setFormData({
      ...formData,
      devices: newDevices,
    })
    setIsEditingDevice(false)
    setIsAddingDevice(false)
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
          'Por favor completa o cancela el dispositivo actual antes de continuar',
      })
      return
    }
    nextStep()
  }

  console.log(isAddingDevice, isEditingDevice)
  return (
    <>
      <div className="animate-fadeIn">
        {/* List of added devices */}
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
                <p className="text-sm text-red-700 dark:text-red-400">
                  {errors.general}
                </p>
              </div>
            )}
            <div className="space-y-3">
              {devices.map((device: any, index: number) => (
                <Card key={device?.id || index} className="p-4">
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
                          {device?.brand || 'Sin marca'}{' '}
                          {device?.model || 'Sin modelo'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {device?.type} •{' '}
                          {device?.serialNumber || 'Sin número de serie'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium">Problema:</span>{' '}
                          {device?.problem}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            ${device?.cost}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {device?.technician}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            {device?.location}
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
                          ></path>
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
                          ></path>
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
                setIsAddingDevice(true), setIsEditingDevice(false)
              }}
            >
              {t('services:second-step.buttonAddMoreDevice')}
            </Button>
          </div>
        )}
        {devices.length === 0 && !isAddingDevice && (
          <div className="mb-6 flex justify-center">
            <div className="flex flex-col items-center justify-center w-full max-w-md p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
              {/* Icono grande */}
              <SmartphoneIcon
                size={48}
                className="text-gray-400 dark:text-gray-500 mb-4"
              />

              {/* Mensaje */}
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-6 text-center">
                {t('services:second-step.message.noDevice')}
              </p>

              {/* Botón destacado */}
              <Button
                variant="default"
                size="lg"
                icon={<PlusIcon size={20} />}
                onClick={() => {
                  setIsAddingDevice(true)
                  setEditIndex(null)
                  setCurrentDevice({
                    type: '',
                    brand: '',
                    model: '',
                    serialNumber: '',
                    color: '',
                    condition: '',
                    problem: '',
                    solution: '',
                    cost: '',
                    advance: '',
                    technician: '',
                    location: '',
                    deliveryDate: '',
                    deliveryTime: '',
                  })
                }}
              >
                {t('services:second-step.buttonAddDevice')}
              </Button>
            </div>
          </div>
        )}

        {/* Add/Edit device form */}
        {isAddingDevice && (
          <Card className="p-6 mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {isEditingDevice === true
                ? t('services:second-step.newDevice.titleEdit')
                : t('services:second-step.newDevice.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t(
                    'services:second-step.newDevice.labelInput.newLabelTypeDevice'
                  )}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Select
                  name="type"
                  value={currentDevice.type}
                  onValueChange={(val) =>
                    handleDeviceChange({
                      target: { name: 'type', value: val },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 w-full py-4.5 border ${
                      errors.location
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
                    {deviceTypes.map((dev) => (
                      <>
                        <SelectItem value={dev}>{dev}</SelectItem>
                      </>
                    ))}
                  </SelectContent>
                </Select>

                {errors.type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.type}
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.brand}
                  </p>
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.model}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="serialNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t(
                    'services:second-step.newDevice.labelInput.newLabelSerialNumber'
                  )}
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
                  htmlFor="condition"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t(
                    'services:second-step.newDevice.labelInput.newLabelAppearance'
                  )}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Select
                  name="condition"
                  value={currentDevice.condition}
                  onValueChange={(val) =>
                    handleDeviceChange({
                      target: { name: 'condition', value: val },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 w-full py-4.5 border ${
                      errors.condition
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-gray-300 dark:border-gray-700'
                    } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <SelectValue
                      placeholder={t(
                        'services:second-step.newDevice.placeholder.newAppearanceInput'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((dev) => (
                      <>
                        <SelectItem value={dev}>{dev}</SelectItem>
                      </>
                    ))}
                  </SelectContent>
                </Select>
                {errors.condition && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.condition}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="problem"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t(
                    'services:second-step.newDevice.labelInput.newLabelServiceDetail'
                  )}{' '}
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.problem}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="solution"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t(
                    'services:second-step.newDevice.labelInput.newLabelSolutionDetail'
                  )}
                </label>
                <textarea
                  id="solution"
                  name="solution"
                  rows={3}
                  className={`bg-white dark:bg-gray-800 block w-full py-2 px-3 border ${'border-gray-300 dark:border-gray-700'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.cost}
                  </p>
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
                    className={`bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border ${'border-gray-300 dark:border-gray-700'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="0.00"
                    value={currentDevice.advance}
                    onChange={handleDeviceChange}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="technician"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t(
                    'services:second-step.newDevice.labelInput.newAssignedTechnician'
                  )}
                </label>
                <Select
                  name="technician"
                  value={currentDevice.technician}
                  onValueChange={(val) =>
                    handleDeviceChange({
                      target: { name: 'technician', value: val },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 w-full py-4.5 border ${'border-gray-300 dark:border-gray-700'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <SelectValue
                      placeholder={t(
                        'services:second-step.newDevice.placeholder.newAssignedTechnicianInput'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <>
                        <SelectItem value={tech}>{tech}</SelectItem>
                      </>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('services:second-step.newDevice.labelInput.newLocation')}
                </label>
                <Select
                  name="location"
                  value={currentDevice.location}
                  onValueChange={(val) =>
                    handleDeviceChange({
                      target: { name: 'location', value: val },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 w-full py-4.5 border ${'border-gray-300 dark:border-gray-700'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <SelectValue
                      placeholder={t(
                        'services:second-step.newDevice.placeholder.newAssignedLocationInput'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <>
                        <SelectItem value={loc}>{loc}</SelectItem>
                      </>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="deliveryDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t(
                    'services:second-step.newDevice.labelInput.newEstimateDate'
                  )}
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
                  {t(
                    'services:second-step.newDevice.labelInput.newEstimateTime'
                  )}
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
                  setEditIndex(null)
                  setErrors({})
                }}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleAddDevice}
                icon={<PlusIcon size={16} />}
              >
                {isEditingDevice === true
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
    </>
  )
}
