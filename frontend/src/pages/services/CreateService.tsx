import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClientFormStep } from './StepFormService/ClientForm-firtstStep'
import { DeviceStep } from './StepFormService/DeviceStep-secondStep'
import { ServiceDetailStep } from './StepFormService/ServiceDetails-thirdStep'
import { SumaryStep } from './StepFormService/Summary-fourStep'
import { Card } from '@/components/ui/Card'
import { CheckIcon, ClipboardIcon, QrCodeIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Stepper from '@/components/ui/Stepper'
import { useTranslation } from 'react-i18next'
import {
  createService,
  getServiceById,
  getServiceCatalogs,
  updateService,
} from '@/services/service/service.api'
import type {
  CreateServicePayload,
  ServiceCatalogsResponse,
  ServiceDetailResponse,
  ServiceFormData,
} from './service.types'
import toast, { Toaster } from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { ServiceQrModal } from '@/components/services/ServiceQrModal'
import { useActiveBranchId } from '@/lib/useActiveBranchId'

const emptyCatalogs: ServiceCatalogsResponse = {
  clients: [],
  branches: [],
  statuses: [],
  deviceTypes: [],
  technicians: [],
  locations: [],
  typeClients: [],
  documentTypes: [],
}

const buildInitialFormData = (): ServiceFormData => ({
  client: null,
  clientId: null,
  newClient: null,
  devices: [],
  serviceDetails: {
    branchId: '',
    receptionDate: new Date().toISOString().split('T')[0],
    statusId: '',
    observations: '',
    code: '',
    qrCode: '',
  },
})

const mapServiceDetailToFormData = (
  service: ServiceDetailResponse
): ServiceFormData => ({
  client: service.client,
  clientId: service.client.id,
  newClient: null,
  devices: service.devices.map((device) => ({
    id: device.id,
    deviceTypeId: device.deviceTypeId,
    brand: device.brand,
    model: device.model,
    serialNumber: device.serialNumber || '',
    color: device.color || '',
    appearance: device.appearance || '',
    unlockType: device.unlockType || '',
    unlockCode: device.unlockCode || '',
    problem: device.problem || '',
    solution: device.solution || '',
    cost: String(device.cost ?? 0),
    advance: String(device.advance ?? 0),
    technicianId: device.technicianId,
    locationId: device.locationId,
    deliveryDate: device.deliveryDate || '',
    deliveryTime: device.deliveryTime || '',
  })),
  serviceDetails: {
    branchId: service.serviceDetails.branchId,
    receptionDate: service.serviceDetails.receptionDate,
    statusId: service.serviceDetails.statusId,
    observations: service.serviceDetails.observations || '',
    code: service.serviceDetails.code || '',
    qrCode: service.serviceDetails.qrCode || '',
  },
})

interface CreateServiceProps {
  serviceRequestId?: string
  embedded?: boolean
  onSaved?: () => void
}

export const CreateService: React.FC<CreateServiceProps> = ({
  serviceRequestId,
  embedded = false,
  onSaved,
}) => {
  const { t } = useTranslation(['common', 'services'])
  const navigate = useNavigate()
  const activeBranchId = useActiveBranchId()
  const { id: routeServiceRequestId } = useParams<{ id: string }>()
  const resolvedServiceRequestId = serviceRequestId ?? routeServiceRequestId
  const isEditMode = Boolean(resolvedServiceRequestId)
  const [currenStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true)
  const [success, setSuccess] = useState(false)
  const [createdCode, setCreatedCode] = useState('')
  const [createdQrCode, setCreatedQrCode] = useState('')
  const [createdId, setCreatedId] = useState<number | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [catalogs, setCatalogs] = useState<ServiceCatalogsResponse>(emptyCatalogs)
  const [formData, setFormData] = useState<ServiceFormData>(buildInitialFormData)

  const steps = [
    t('services:first-step.stepper.one'),
    t('services:first-step.stepper.two'),
    t('services:first-step.stepper.three'),
    t('services:first-step.stepper.four'),
  ]

  useEffect(() => {
    if (!activeBranchId) {
      return
    }

    let isCancelled = false

    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true)
      try {
        const data = await getServiceCatalogs()
        if (isCancelled) return

        setCatalogs(data)
        setCurrentStep(0)
        setSuccess(false)
        setCreatedCode('')
        setCreatedQrCode('')
        setIsQrModalOpen(false)

        if (isEditMode && resolvedServiceRequestId) {
          const serviceDetail = await getServiceById(resolvedServiceRequestId)
          if (isCancelled) return
          setFormData(mapServiceDetailToFormData(serviceDetail))
          return
        }

        setFormData({
          ...buildInitialFormData(),
          serviceDetails: {
            ...buildInitialFormData().serviceDetails,
            branchId: data.branches[0]?.id || '',
            statusId: data.statuses[0]?.id || '',
          },
        })
      } catch (error) {
        if (isCancelled) return
        console.error(error)
        toast.error(getApiErrorMessage(error, 'No fue posible cargar la información del servicio'))
        if (isEditMode && !embedded) {
          navigate('/services/list')
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCatalogs(false)
        }
      }
    }

    void loadCatalogs()

    return () => {
      isCancelled = true
    }
  }, [activeBranchId, embedded, isEditMode, navigate, resolvedServiceRequestId])

  const nextSetp = () => {
    setCurrentStep(currenStep + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setCurrentStep(currenStep - 1)
    window.scrollTo(0, 0)
  }

  const payload = useMemo<CreateServicePayload>(() => {
    return {
      clientId: formData.clientId,
      newClient: formData.clientId
        ? null
        : formData.newClient
          ? {
              ...formData.newClient,
              email: formData.newClient.email || null,
              address: formData.newClient.address || null,
              typeClientId: formData.newClient.typeClientId || null,
              documentTypeId: formData.newClient.documentTypeId || null,
            }
          : null,
      devices: formData.devices.map((device) => ({
        deviceTypeId: device.deviceTypeId,
        brand: device.brand.trim(),
        model: device.model.trim(),
        serialNumber: device.serialNumber.trim() || null,
        color: device.color.trim() || null,
        appearance: device.appearance.trim() || null,
        unlockType: device.unlockType.trim() || null,
        unlockCode: device.unlockCode.trim() || null,
        problem: device.problem.trim(),
        solution: device.solution.trim() || null,
        cost: Number(device.cost || 0),
        advance: Number(device.advance || 0),
        technicianId: device.technicianId,
        locationId: device.locationId,
        deliveryDate: device.deliveryDate || null,
        deliveryTime: device.deliveryTime || null,
      })),
      serviceDetails: {
        branchId: formData.serviceDetails.branchId,
        receptionDate: formData.serviceDetails.receptionDate,
        statusId: formData.serviceDetails.statusId,
        observations: formData.serviceDetails.observations.trim() || null,
        code: formData.serviceDetails.code.trim() || null,
        qrCode: isEditMode ? formData.serviceDetails.qrCode.trim() || null : null,
      },
    }
  }, [formData, isEditMode])

  const handleSubmit = async () => {
    if (!payload.clientId && !payload.newClient) {
      toast.error('Selecciona un cliente existente o captura uno nuevo')
      return
    }

    setIsSubmitting(true)
    try {
      const response =
        isEditMode && resolvedServiceRequestId
          ? await updateService(resolvedServiceRequestId, payload)
          : await createService(payload)

      if (embedded) {
        toast.success(
          isEditMode
            ? t('services:updateSuccess')
            : 'Servicio guardado correctamente'
        )
        onSaved?.()
        return
      }

      setCreatedCode(response.code ?? '')
      setCreatedQrCode(response.qrCode ?? '')
      setCreatedId(response.id ?? null)
      setSuccess(true)
      if (response.qrCode) {
        setIsQrModalOpen(true)
      }
      toast.success(
        isEditMode
          ? t('services:updateSuccess')
          : 'Servicio guardado correctamente'
      )
    } catch (error) {
      console.error(error)
      toast.error(
        getApiErrorMessage(
          error,
          isEditMode ? t('services:updateError') : 'No fue posible guardar el servicio'
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currenStep) {
      case 0:
        return (
          <ClientFormStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextSetp}
            catalogs={catalogs}
          />
        )
      case 1:
        return (
          <DeviceStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextSetp}
            prevStep={prevStep}
            catalogs={catalogs}
          />
        )
      case 2:
        return (
          <ServiceDetailStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextSetp}
            prevStep={prevStep}
            catalogs={catalogs}
          />
        )
      case 3:
        return (
          <SumaryStep
            formData={formData}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            prevStep={prevStep}
            catalogs={catalogs}
          />
        )
      default:
        return null
    }
  }
  return (
    <>
      {!embedded && <Toaster />}
      <div className={embedded ? 'max-h-[72vh] overflow-y-auto pr-1' : 'max-w-8xl pr-20 pl-20'}>
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isEditMode ? t('services:editTitle') : t('services:title')}
          </h1>
          <p className="mt-3 text-md text-gray-500 dark:text-gray-300">
            {isEditMode
              ? t('services:editDescription')
              : t('services:description')}
          </p>
        </div>
        {isLoadingCatalogs ? (
          <Card className="p-8 text-center">Cargando catálogos...</Card>
        ) : (
          <>
        {success ? (
          <Card className="p-8 text-center animate-fadeIn">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
              <CheckIcon
                size={24}
                className="text-green-600 dark:text-green-400"
              />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {isEditMode ? t('services:updateSuccess') : t('services:success')}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {isEditMode ? t('services:updateQrCodeMessage') : t('services:qrCodeMessage')}{' '}
              {createdCode || 'N/A'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {createdQrCode && (
                <Button
                  variant="outline"
                  onClick={() => setIsQrModalOpen(true)}
                  icon={<QrCodeIcon size={18} />}
                >
                  Ver código QR
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => {
                  if (embedded) {
                    onSaved?.()
                    return
                  }
                  navigate('/services/list')
                }}
                icon={<ClipboardIcon size={18} />}
              >
                {embedded ? 'Cerrar' : t('services:finish')}
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <Stepper steps={steps} currentStep={currenStep} />
            </div>
            <Card className="p-6">{renderStep()}</Card>
          </>
        )}
          </>
        )}
      </div>
      {createdQrCode && (
        <ServiceQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          qrCode={createdQrCode}
          serviceCode={createdCode}
          serviceRequestId={
            createdId ??
            (resolvedServiceRequestId ? Number(resolvedServiceRequestId) : undefined)
          }
        />
      )}
    </>
  )
}
