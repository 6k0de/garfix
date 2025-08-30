import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { CheckIcon, ChevronLeftIcon, SmartphoneIcon } from 'lucide-react'
import type React from 'react'
import { useTranslation } from 'react-i18next'

export const SumaryStep: React.FC<{
  formData: any
  prevStep: () => void
  handleSubmit: () => void
  isSubmitting: boolean
}> = ({ formData, prevStep, handleSubmit, isSubmitting }) => {
  const { t } = useTranslation(['common', 'services'])

  const clientInfo = formData.client || formData.newClient
  console.log(clientInfo.isNew)
  return (
    <>
      <div className="animate-fadeIn">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          {t('services:summary.title')}
        </h2>
        <div className="space-y-4">
          {/* Client Information */}
          <div className="flex gap-4 items-stretch">
            <div className="flex-1 flex">
              <Card className="p-6 h-full w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {t('services:summary.subtitle1')}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {formData.client.isNew === undefined
                      ? t('services:summary.tagExistingUser')
                      : t('services:summary.tagNotExistingUser')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('services:first-step.labelInput.newLabelUserName')}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {clientInfo?.name || clientInfo?.fullName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('services:first-step.labelInput.newLabelUserPhone')}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {clientInfo?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('services:first-step.labelInput.newLabelUserEmail')}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {clientInfo?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('services:first-step.labelInput.newLabelUserAddress')}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {clientInfo?.address || 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="flex-1 flex">
              <Card className="p-6 h-full w-full">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('services:summary.subtitle2')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('services:third-step.labelInput.serviceCode')}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.serviceDetails?.qrCode || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('common:others.branch')}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.serviceDetails?.branch || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('services:third-step.labelInput.dateReception')}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.serviceDetails?.receptionDate || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('services:third-step.labelInput.initialStatus')}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formData.serviceDetails?.status || 'N/A'}
                    </p>
                  </div>
                  {formData.serviceDetails?.observations && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Observaciones
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formData.serviceDetails.observations}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
          {/* Devices Information */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('services:summary.subtitle3')} ({formData.devices?.length || 0}
              )
            </h3>
            <div className="space-y-4">
              {formData.devices?.map((device: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-4">
                      <SmartphoneIcon
                        size={24}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {device.brand} {device.model}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {device.type} •{' '}
                        {device.serialNumber || 'Sin número de serie'}
                      </p>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t(
                              'services:second-step.newDevice.placeholder.newServiceDetailInput'
                            )}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.problem}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t(
                              'services:second-step.newDevice.labelInput.newAssignedTechnician'
                            )}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.technician}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t(
                              'services:second-step.newDevice.labelInput.newCostRepair'
                            )}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            ${device.cost}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t(
                              'services:second-step.newDevice.labelInput.newAdvance'
                            )}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.advance ? `$${device.advance}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t(
                              'services:second-step.newDevice.labelInput.newLocation'
                            )}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.location}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {t(
                              'services:second-step.newDevice.labelInput.newEstimateDate'
                            )}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {device.deliveryDate
                              ? `${device.deliveryDate}${
                                  device.deliveryTime
                                    ? ' ' + device.deliveryTime
                                    : ''
                                }`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {/* Service Details */}

          {/* Total cost */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {t('services:summary.subtitle4')}

            </h3>
            <div className="space-y-3">
              {formData.devices?.map((device: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {device.type} {device.brand} {device.model}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${device.cost}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {t('services:summary.total')}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    $
                    {formData.devices
                      ?.reduce(
                        (acc: number, device: any) =>
                          acc + (parseFloat(device.cost) || 0),
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('services:summary.advanceTotal')}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    $
                    {formData.devices
                      ?.reduce(
                        (acc: number, device: any) =>
                          acc + (parseFloat(device.advance) || 0),
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('services:summary.totalPending')}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    $
                    {(
                      formData.devices?.reduce(
                        (acc: number, device: any) =>
                          acc + (parseFloat(device.cost) || 0),
                        0
                      ) -
                      formData.devices?.reduce(
                        (acc: number, device: any) =>
                          acc + (parseFloat(device.advance) || 0),
                        0
                      )
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            icon={<ChevronLeftIcon size={16} />}
          >
            {t('common:actions.previous')}
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting}
            icon={isSubmitting ? undefined : <CheckIcon size={16} />}
            className="min-w-[160px]"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t('services:summary.saving')}
              </span>
            ) : (
              t('services:summary.buttonFinish')
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
