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
import { ServiceQrModal } from '@/components/services/ServiceQrModal'

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

export const CreateService: React.FC = () => {
  const { t } = useTranslation(['common', 'services'])
  const navigate = useNavigate()
  const { id: serviceRequestId } = useParams<{ id: string }>()
  const isEditMode = Boolean(serviceRequestId)
  const [currenStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true)
  const [success, setSuccess] = useState(false)
  const [createdCode, setCreatedCode] = useState('')
  const [createdQrCode, setCreatedQrCode] = useState('')
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
    const loadCatalogs = async () => {
      try {
        const data = await getServiceCatalogs()
        setCatalogs(data)

        if (isEditMode && serviceRequestId) {
          const serviceDetail = await getServiceById(serviceRequestId)
          setFormData(mapServiceDetailToFormData(serviceDetail))
          return
        }

        setFormData((prev) => ({
          ...prev,
          serviceDetails: {
            ...prev.serviceDetails,
            branchId: prev.serviceDetails.branchId || data.branches[0]?.id || '',
            statusId: prev.serviceDetails.statusId || data.statuses[0]?.id || '',
          },
        }))
      } catch (error) {
        console.error(error)
        toast.error('No fue posible cargar la información del servicio')
        if (isEditMode) {
          navigate('/services/list')
        }
      } finally {
        setIsLoadingCatalogs(false)
      }
    }

    loadCatalogs()
  }, [isEditMode, navigate, serviceRequestId])

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
            }
          : null,
      devices: formData.devices.map((device) => ({
        deviceTypeId: device.deviceTypeId,
        brand: device.brand.trim(),
        model: device.model.trim(),
        serialNumber: device.serialNumber.trim() || null,
        color: device.color.trim() || null,
        appearance: device.appearance.trim() || null,
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
        isEditMode && serviceRequestId
          ? await updateService(serviceRequestId, payload)
          : await createService(payload)

      setCreatedCode(response.code ?? '')
      setCreatedQrCode(response.qrCode ?? '')
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
        isEditMode
          ? t('services:updateError')
          : 'No fue posible guardar el servicio'
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
      <Toaster />
      <div className="max-w-8xl pr-20 pl-20">
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
                onClick={() => navigate('/services/list')}
                icon={<ClipboardIcon size={18} />}
              >
                {t('services:finish')}
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
        />
      )}
    </>
  )
}
