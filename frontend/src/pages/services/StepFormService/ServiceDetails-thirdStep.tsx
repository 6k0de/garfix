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
  QrCodeIcon,
} from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export const ServiceDetailStep: React.FC<{
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  nextStep: () => void
  prevStep: () => void
}> = ({ formData, setFormData, nextStep, prevStep }) => {
  const { t } = useTranslation(['common', 'services'])
  const [serviceDetails, setServiceDetails] = useState(
    formData.serviceDetails || {
      branch: 'Sucursal Principal',
      receptionDate: new Date().toISOString().split('T')[0],
      status: 'Recibido',
      observations: '',
      qrCode: 'SRV-' + Math.floor(100000 + Math.random() * 900000),
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const branches = ['Sucursal Principal', 'Sucursal Norte', 'Sucursal Sur']
  const statusOptions = [
    'Recibido',
    'En diagnóstico',
    'En reparación',
    'Esperando repuesto',
    'Listo para entrega',
  ]
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setServiceDetails({
      ...serviceDetails,
      [name]: value,
    })
    setFormData({
      ...formData,
      serviceDetails: {
        ...serviceDetails,
        [name]: value,
      },
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

  const handleContinue = () => {
    nextStep()
  }

  return (
    <>
      <div className="animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          {t('services:third-step.title')}
        </h2>
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="branch"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('common:others.branch')}
              </label>
              <div className="relative">
                <Select
                  name="branch"
                  value={serviceDetails.branch}
                  onValueChange={(val) =>
                    handleChange({
                      target: { name: 'branch', value: val },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                >
                  <SelectTrigger
                    className={`bg-white dark:bg-gray-800 w-full pl-10 py-2 px-3 border ${'border-gray-300 dark:border-gray-700'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <SelectValue
                      placeholder={t(
                        'services:third-step.placeholder.branchInput'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <>
                        <SelectItem value={branch}>{branch}</SelectItem>
                      </>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label
                htmlFor="receptionDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:third-step.labelInput.dateReception')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="receptionDate"
                  name="receptionDate"
                  className={`bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border ${'border-gray-300 dark:border-gray-700'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  value={serviceDetails.receptionDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('services:third-step.labelInput.initialStatus')}
              </label>
              <Select
                name="status"
                value={serviceDetails.status}
                onValueChange={(val) =>
                  handleChange({
                    target: { name: 'status', value: val },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
              >
                <SelectTrigger
                  className={`bg-white dark:bg-gray-800  w-full pl-10 py-2 px-3 border ${'border-gray-300 dark:border-gray-700'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                >
                  <SelectValue
                    placeholder={t(
                      'services:third-step.placeholder.statusInitialInput'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((branch) => (
                    <>
                      <SelectItem value={branch}>{branch}</SelectItem>
                    </>
                  ))}
                </SelectContent>
              </Select>
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
                  className="bg-white dark:bg-gray-800 block w-full pl-10 py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm "
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
                placeholder={t(
                  'services:third-step.placeholder.observationsInput'
                )}
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
    </>
  )
}
