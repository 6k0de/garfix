import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ChevronLeftIcon, SmartphoneIcon } from 'lucide-react'
import type React from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ServiceCatalogsResponse, ServiceFormData } from '../service.types'

interface SummaryStepProps {
  formData: ServiceFormData
  prevStep: () => void
  handleSubmit: () => void
  isSubmitting: boolean
  catalogs: ServiceCatalogsResponse
}

export const SumaryStep: React.FC<SummaryStepProps> = ({
  formData,
  prevStep,
  handleSubmit,
  isSubmitting,
  catalogs,
}) => {
  const { t } = useTranslation(['common', 'services'])

  const branchNameById = useMemo(
    () =>
      new Map(catalogs.branches.map((branch) => [branch.id, branch.name] as const)),
    [catalogs.branches]
  )

  const statusNameById = useMemo(
    () =>
      new Map(catalogs.statuses.map((status) => [status.id, status.name] as const)),
    [catalogs.statuses]
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

  const clientInfo = formData.client ?? formData.newClient
  const isExistingClient = Boolean(formData.clientId)

  const totalCost = formData.devices
    .reduce((acc, device) => acc + (Number(device.cost) || 0), 0)
    .toFixed(2)

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
        {t('services:summary.title')}
      </h2>

      <div className="space-y-4">
        <div className="flex gap-4 items-stretch flex-col xl:flex-row">
          <div className="flex-1 flex">
            <Card className="p-6 h-full w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('services:summary.subtitle1')}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {isExistingClient
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
                    {clientInfo?.name || 'N/A'}
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
                    {formData.serviceDetails.qrCode || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('common:others.branch')}
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {branchNameById.get(formData.serviceDetails.branchId) || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('services:third-step.labelInput.dateReception')}
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formData.serviceDetails.receptionDate || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('services:third-step.labelInput.initialStatus')}
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {statusNameById.get(formData.serviceDetails.statusId) || 'N/A'}
                  </p>
                </div>
                {formData.serviceDetails.observations && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {t('services:third-step.labelInput.observations')}
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

        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('services:summary.subtitle3')} ({formData.devices.length})
          </h3>
          <div className="space-y-4">
            {formData.devices.map((device) => (
              <div
                key={device.id}
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
                      {deviceTypeNameById.get(device.deviceTypeId) || 'Sin tipo'} •{' '}
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
                          {technicianNameById.get(device.technicianId) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t('services:second-step.newDevice.labelInput.newCostRepair')}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          ${device.cost || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t('services:second-step.newDevice.labelInput.newAdvance')}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {device.advance ? `$${device.advance}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t('services:second-step.newDevice.labelInput.newLocation')}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {locationNameById.get(device.locationId) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t('services:second-step.newDevice.labelInput.newEstimateDate')}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {device.deliveryDate
                            ? `${device.deliveryDate}${
                                device.deliveryTime ? ` ${device.deliveryTime}` : ''
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

        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {t('services:summary.subtitle4')}
          </h3>
          <div className="space-y-3">
            {formData.devices.map((device) => (
              <div key={device.id} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {deviceTypeNameById.get(device.deviceTypeId) || 'Equipo'} {device.brand}{' '}
                  {device.model}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${Number(device.cost || 0).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">
                  {t('services:summary.total')}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  ${totalCost}
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
        <Button variant="default" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : t('common:actions.save')}
        </Button>
      </div>
    </div>
  )
}
