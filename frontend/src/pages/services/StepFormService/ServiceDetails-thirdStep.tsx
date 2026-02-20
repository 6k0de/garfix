import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { CalendarIcon, ChevronLeftIcon, QrCodeIcon } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ServiceCatalogsResponse, ServiceFormData } from '../service.types'

interface ServiceDetailStepProps {
  formData: ServiceFormData
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>
  nextStep: () => void
  prevStep: () => void
  catalogs: ServiceCatalogsResponse
}

export const ServiceDetailStep: React.FC<ServiceDetailStepProps> = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  catalogs,
}) => {
  const { t } = useTranslation(['common', 'services'])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const serviceDetails = formData.serviceDetails

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      serviceDetails: {
        ...prev.serviceDetails,
        [name]: value,
      },
    }))

    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev }
        delete nextErrors[name]
        return nextErrors
      })
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!serviceDetails.branchId) {
      nextErrors.branchId = 'Selecciona una sucursal'
    }
    if (!serviceDetails.statusId) {
      nextErrors.statusId = 'Selecciona un estatus'
    }
    if (!serviceDetails.receptionDate) {
      nextErrors.receptionDate = 'Selecciona la fecha de recepción'
    }

    return nextErrors
  }

  const handleContinue = () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    nextStep()
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        {t('services:third-step.title')}
      </h2>
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="branchId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('common:others.branch')} <span className="text-red-500">*</span>
            </label>
            <Select
              value={serviceDetails.branchId}
              onValueChange={(value) =>
                handleChange({
                  target: { name: 'branchId', value },
                } as React.ChangeEvent<HTMLInputElement>)
              }
            >
              <SelectTrigger
                className={`bg-white dark:bg-gray-800 w-full py-2 px-3 border ${
                  errors.branchId
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              >
                <SelectValue
                  placeholder={t('services:third-step.placeholder.branchInput')}
                />
              </SelectTrigger>
              <SelectContent>
                {catalogs.branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branchId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.branchId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="receptionDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('services:third-step.labelInput.dateReception')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="date"
                id="receptionDate"
                name="receptionDate"
                className={`bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border ${
                  errors.receptionDate
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={serviceDetails.receptionDate}
                onChange={handleChange}
              />
            </div>
            {errors.receptionDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.receptionDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="statusId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('services:third-step.labelInput.initialStatus')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <Select
              value={serviceDetails.statusId}
              onValueChange={(value) =>
                handleChange({
                  target: { name: 'statusId', value },
                } as React.ChangeEvent<HTMLInputElement>)
              }
            >
              <SelectTrigger
                className={`bg-white dark:bg-gray-800 w-full py-2 px-3 border ${
                  errors.statusId
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-700'
                } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              >
                <SelectValue
                  placeholder={t('services:third-step.placeholder.statusInitialInput')}
                />
              </SelectTrigger>
              <SelectContent>
                {catalogs.statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.statusId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.statusId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="qrCode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('services:third-step.labelInput.serviceCode')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <QrCodeIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                id="qrCode"
                name="qrCode"
                className="bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={serviceDetails.qrCode}
                readOnly
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="observations"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('services:third-step.labelInput.observations')}
            </label>
            <textarea
              id="observations"
              name="observations"
              rows={4}
              className="bg-white dark:bg-gray-800 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={t('services:third-step.placeholder.observationsInput')}
              value={serviceDetails.observations}
              onChange={handleChange}
            />
          </div>
        </div>
      </Card>
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
