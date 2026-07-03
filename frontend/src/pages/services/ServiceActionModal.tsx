import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BanIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ExternalLinkIcon,
  PlusIcon,
  QrCodeIcon,
  SaveIcon,
  Settings2Icon,
  Trash2Icon,
  UserIcon,
  WrenchIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import {
  getServiceById,
  getServiceCatalogs,
  updateService,
} from '@/services/service/service.api'
import type {
  CreateServicePayload,
  RefundMethod,
  ServiceCatalogsResponse,
  ServiceDetailResponse,
  ServiceDeviceFormValue,
  ServiceFormData,
} from './service.types'
import { buildEvidencePageUrl } from '@/lib/evidence'
import { ServiceQrModal } from '@/components/services/ServiceQrModal'
import { useActiveBranchId } from '@/lib/useActiveBranchId'

type ServiceActionTab = 'info' | 'devices' | 'service' | 'cancel' | 'evidence'
type YesNoValue = 'YES' | 'NO' | ''

interface CancelServiceFormState {
  total: string
  totalPaid: string
  debt: string
  amount: string
  statusId: string
  hasRefund: YesNoValue
  refundMethod: RefundMethod | ''
  cashFromBox: YesNoValue
  bankAccount: string
  bankFromBox: YesNoValue
  sourceBoxName: string
  notes: string
}

interface ServiceActionModalProps {
  serviceId: number
  serviceCode: string
  qrCode: string
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

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

const DEFAULT_CLOSE_STATUS_KEYWORDS = [
  'entregad',
  'terminad',
  'finalizad',
  'completad',
  'cerrad',
]

const DEFAULT_CANCEL_STATUS_KEYWORDS = ['cancelad', 'anulad', 'rechazad']

const normalizeStatusName = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const CLOSE_STATUS_PRIORITY = (import.meta.env.VITE_CLOSE_STATUS_PRIORITY || '')
  .split(',')
  .map((item: string) => item.trim())
  .filter(Boolean)

const CANCEL_STATUS_PRIORITY = (import.meta.env.VITE_CANCEL_STATUS_PRIORITY || '')
  .split(',')
  .map((item: string) => item.trim())
  .filter(Boolean)

const toYesNoValue = (value?: boolean | null): YesNoValue => {
  if (value === true) return 'YES'
  if (value === false) return 'NO'
  return ''
}

const toBooleanValue = (value: YesNoValue): boolean | null => {
  if (value === 'YES') return true
  if (value === 'NO') return false
  return null
}

const parseNonNegative = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

const numberToInputValue = (value: number | null | undefined) =>
  Number.isFinite(value) ? String(value) : '0'

const resolveStatusByPriority = (
  statuses: Array<{ id: string; name: string }>,
  currentStatusId: string | undefined,
  configuredPriority: string[],
  fallbackKeywords: string[]
) => {
  const statusEntries = statuses.map((status) => ({
    id: status.id,
    normalized: normalizeStatusName(status.name),
  }))

  if (statusEntries.length === 0) return null

  const tryByPriority = (priority: string[]) => {
    for (const rawCandidate of priority) {
      const normalizedCandidate = normalizeStatusName(rawCandidate)
      if (!normalizedCandidate) continue

      const exact = statusEntries.find(
        (entry) =>
          entry.id !== currentStatusId && entry.normalized === normalizedCandidate
      )
      if (exact) return exact.id

      const partial = statusEntries.find(
        (entry) =>
          entry.id !== currentStatusId &&
          (entry.normalized.includes(normalizedCandidate) ||
            normalizedCandidate.includes(entry.normalized))
      )
      if (partial) return partial.id
    }
    return null
  }

  const configuredMatch = tryByPriority(configuredPriority)
  if (configuredMatch) return configuredMatch

  for (const keyword of fallbackKeywords) {
    const fallbackMatch = statusEntries.find(
      (entry) => entry.id !== currentStatusId && entry.normalized.includes(keyword)
    )
    if (fallbackMatch) return fallbackMatch.id
  }

  return null
}

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

const buildPayload = (formData: ServiceFormData): CreateServicePayload => ({
  clientId: formData.clientId,
  newClient: null,
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
    qrCode: formData.serviceDetails.qrCode.trim() || null,
  },
})

const createNewDeviceDraft = (
  catalogs: ServiceCatalogsResponse,
  id: string,
  sourceDevice?: ServiceDeviceFormValue
): ServiceDeviceFormValue => ({
  id,
  deviceTypeId: sourceDevice?.deviceTypeId || catalogs.deviceTypes[0]?.id || '',
  brand: '',
  model: '',
  serialNumber: '',
  color: '',
  appearance: '',
  unlockType: '',
  unlockCode: '',
  problem: '',
  solution: '',
  cost: '0',
  advance: '0',
  technicianId: sourceDevice?.technicianId || catalogs.technicians[0]?.id || '',
  locationId: sourceDevice?.locationId || catalogs.locations[0]?.id || '',
  deliveryDate: sourceDevice?.deliveryDate || '',
  deliveryTime: sourceDevice?.deliveryTime || '',
})

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

const validateFormData = (formData: ServiceFormData, t: TranslateFn) => {
  if (!formData.serviceDetails.branchId) {
    return t('services:action-modal.validation.selectBranch')
  }

  if (!formData.serviceDetails.statusId) {
    return t('services:action-modal.validation.selectStatus')
  }

  if (!formData.serviceDetails.receptionDate) {
    return t('services:action-modal.validation.receptionRequired')
  }

  if (formData.devices.length === 0) {
    return t('services:action-modal.validation.atLeastOneDevice')
  }

  for (const [index, device] of formData.devices.entries()) {
    const number = index + 1
    if (!device.deviceTypeId) {
      return t('services:action-modal.validation.deviceType', { number })
    }
    if (!device.brand.trim()) {
      return t('services:action-modal.validation.deviceBrand', { number })
    }
    if (!device.model.trim()) {
      return t('services:action-modal.validation.deviceModel', { number })
    }
    if (!device.problem.trim()) {
      return t('services:action-modal.validation.deviceProblem', { number })
    }
    if (!device.technicianId) {
      return t('services:action-modal.validation.deviceTechnician', { number })
    }
    if (!device.locationId) {
      return t('services:action-modal.validation.deviceLocation', { number })
    }
  }

  return null
}

export const ServiceActionModal = ({
  serviceId,
  serviceCode,
  qrCode,
  isOpen,
  onClose,
  onSaved,
}: ServiceActionModalProps) => {
  const { t } = useTranslation(['common', 'services'])
  const activeBranchId = useActiveBranchId()
  const [activeTab, setActiveTab] = useState<ServiceActionTab>('info')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isClosingService, setIsClosingService] = useState(false)
  const [isCancellingService, setIsCancellingService] = useState(false)
  const [catalogs, setCatalogs] = useState<ServiceCatalogsResponse>(emptyCatalogs)
  const [formData, setFormData] = useState<ServiceFormData | null>(null)
  const [cancelForm, setCancelForm] = useState<CancelServiceFormState | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [lastAddedDeviceId, setLastAddedDeviceId] = useState<string | null>(null)
  const [showCloseStatusPicker, setShowCloseStatusPicker] = useState(false)
  const [manualCloseStatusId, setManualCloseStatusId] = useState('')

  const statusNameById = useMemo(
    () => new Map(catalogs.statuses.map((item) => [item.id, item.name])),
    [catalogs.statuses]
  )

  const branchNameById = useMemo(
    () => new Map(catalogs.branches.map((item) => [item.id, item.name])),
    [catalogs.branches]
  )

  const deviceTypeNameById = useMemo(
    () => new Map(catalogs.deviceTypes.map((item) => [item.id, item.name])),
    [catalogs.deviceTypes]
  )

  const technicianNameById = useMemo(
    () => new Map(catalogs.technicians.map((item) => [item.id, item.name])),
    [catalogs.technicians]
  )

  const locationNameById = useMemo(
    () => new Map(catalogs.locations.map((item) => [item.id, item.name])),
    [catalogs.locations]
  )

  const totalBudget = useMemo(() => {
    if (!formData) return 0
    return formData.devices.reduce((acc, device) => acc + Number(device.cost || 0), 0)
  }, [formData])

  const totalAdvance = useMemo(() => {
    if (!formData) return 0
    return formData.devices.reduce(
      (acc, device) => acc + Number(device.advance || 0),
      0
    )
  }, [formData])

  useEffect(() => {
    if (!isOpen || !activeBranchId) return

    let isCancelled = false

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [serviceDetail, serviceCatalogs] = await Promise.all([
          getServiceById(serviceId),
          getServiceCatalogs(),
        ])
        if (isCancelled) return
        const computedTotal = serviceDetail.devices.reduce(
          (acc, device) => acc + Number(device.cost || 0),
          0
        )
        const computedTotalPaid = serviceDetail.devices.reduce(
          (acc, device) => acc + Number(device.advance || 0),
          0
        )
        const computedDebt = Math.max(computedTotal - computedTotalPaid, 0)
        const defaultCancelStatusId =
          serviceDetail.cancellation?.statusId ||
          resolveStatusByPriority(
            serviceCatalogs.statuses,
            serviceDetail.serviceDetails.statusId,
            CANCEL_STATUS_PRIORITY,
            DEFAULT_CANCEL_STATUS_KEYWORDS
          ) ||
          serviceDetail.serviceDetails.statusId ||
          serviceCatalogs.statuses[0]?.id ||
          ''

        setCatalogs(serviceCatalogs)
        setFormData(mapServiceDetailToFormData(serviceDetail))
        setCancelForm({
          total: numberToInputValue(serviceDetail.cancellation?.total ?? computedTotal),
          totalPaid: numberToInputValue(
            serviceDetail.cancellation?.totalPaid ?? computedTotalPaid
          ),
          debt: numberToInputValue(serviceDetail.cancellation?.debt ?? computedDebt),
          amount: numberToInputValue(
            serviceDetail.cancellation?.amount ?? computedDebt
          ),
          statusId: defaultCancelStatusId,
          hasRefund: serviceDetail.cancellation?.hasRefund ? 'YES' : 'NO',
          refundMethod: serviceDetail.cancellation?.refundMethod ?? '',
          cashFromBox: toYesNoValue(serviceDetail.cancellation?.cashFromBox),
          bankAccount: serviceDetail.cancellation?.bankAccount ?? '',
          bankFromBox: toYesNoValue(serviceDetail.cancellation?.bankFromBox),
          sourceBoxName: serviceDetail.cancellation?.sourceBoxName ?? '',
          notes: serviceDetail.cancellation?.notes ?? '',
        })
        setActiveTab('info')
        setShowCloseStatusPicker(false)
        setManualCloseStatusId('')
      } catch (error) {
        if (isCancelled) return
        console.error(error)
        toast.error(getApiErrorMessage(error, t('services:action-modal.toasts.loadError')))
        onClose()
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isCancelled = true
    }
  }, [activeBranchId, isOpen, onClose, serviceId, t])

  useEffect(() => {
    if (!lastAddedDeviceId) return
    const timer = window.setTimeout(() => {
      setLastAddedDeviceId(null)
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [lastAddedDeviceId])

  const updateServiceField = (
    field: keyof ServiceFormData['serviceDetails'],
    value: string
  ) => {
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails,
          [field]: value,
        },
      }
    })
  }

  const updateDeviceField = (
    deviceId: string,
    field: keyof ServiceDeviceFormValue,
    value: string
  ) => {
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        devices: prev.devices.map((device) =>
          device.id === deviceId
            ? {
                ...device,
                [field]: value,
              }
            : device
        ),
      }
    })
  }

  const handleAddDevice = () => {
    const nextDeviceId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    setFormData((prev) => {
      if (!prev) return prev
      const sourceDevice = prev.devices[prev.devices.length - 1]
      return {
        ...prev,
        devices: [
          ...prev.devices,
          createNewDeviceDraft(catalogs, nextDeviceId, sourceDevice),
        ],
      }
    })

    setLastAddedDeviceId(nextDeviceId)

    // Espera el render para llevar al usuario al nuevo dispositivo agregado.
    window.requestAnimationFrame(() => {
      const element = document.getElementById(`device-card-${nextDeviceId}`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    toast.success(t('services:action-modal.toasts.deviceAdded'))
  }

  const handleRemoveDevice = (deviceId: string) => {
    setFormData((prev) => {
      if (!prev) return prev
      if (prev.devices.length <= 1) {
        toast.error(t('services:action-modal.toasts.minimumOneDevice'))
        return prev
      }

      return {
        ...prev,
        devices: prev.devices.filter((device) => device.id !== deviceId),
      }
    })
  }

  const handleSaveChanges = async () => {
    if (!formData) return

    const validationError = validateFormData(formData, t)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSaving(true)
    try {
      const payload = buildPayload(formData)
      await updateService(serviceId, payload)
      toast.success(t('services:action-modal.toasts.updated'))
      onSaved()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('services:action-modal.toasts.updateError')))
    } finally {
      setIsSaving(false)
    }
  }

  const isStatusIdTerminal = (statusId: string) => {
    const normalizedStatus = normalizeStatusName(statusNameById.get(statusId))
    if (!normalizedStatus) return false

    const configuredMatch = CLOSE_STATUS_PRIORITY.some((candidate: string) => {
      const normalizedCandidate = normalizeStatusName(candidate)
      if (!normalizedCandidate) return false
      return (
        normalizedStatus === normalizedCandidate ||
        normalizedStatus.includes(normalizedCandidate) ||
        normalizedCandidate.includes(normalizedStatus)
      )
    })

    if (configuredMatch) return true

    return DEFAULT_CLOSE_STATUS_KEYWORDS.some((keyword) =>
      normalizedStatus.includes(keyword)
    )
  }

  const resolveCloseStatusId = (currentStatusId?: string) => {
    return resolveStatusByPriority(
      catalogs.statuses,
      currentStatusId,
      CLOSE_STATUS_PRIORITY,
      DEFAULT_CLOSE_STATUS_KEYWORDS
    )
  }

  const resolveCancelStatusId = (currentStatusId?: string) => {
    return resolveStatusByPriority(
      catalogs.statuses,
      currentStatusId,
      CANCEL_STATUS_PRIORITY,
      DEFAULT_CANCEL_STATUS_KEYWORDS
    )
  }

  const runCloseService = async (targetStatusId: string) => {
    if (!formData) return

    setIsClosingService(true)
    try {
      const nextFormData: ServiceFormData = {
        ...formData,
        serviceDetails: {
          ...formData.serviceDetails,
          statusId: targetStatusId,
        },
      }

      const payload = buildPayload(nextFormData)
      await updateService(serviceId, payload)
      setFormData(nextFormData)
      setShowCloseStatusPicker(false)
      setManualCloseStatusId('')
      toast.success(t('services:action-modal.toasts.closed'))
      onSaved()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('services:action-modal.toasts.closeError')))
    } finally {
      setIsClosingService(false)
    }
  }

  const handlePerformDelivery = () => {
    if (!formData || isSaving || isClosingService || isCancellingService) return

    const currentStatusId = formData.serviceDetails.statusId
    if (isStatusIdTerminal(currentStatusId)) {
      toast.success(t('services:action-modal.toasts.alreadyTerminal'))
      return
    }

    const autoCloseStatusId = resolveCloseStatusId(currentStatusId)
    if (autoCloseStatusId) {
      void runCloseService(autoCloseStatusId)
      return
    }

    const fallbackStatusId = catalogs.statuses[0]?.id || ''
    setManualCloseStatusId(currentStatusId || fallbackStatusId)
    setShowCloseStatusPicker(true)
    toast(t('services:action-modal.toasts.manualStatusRequired'))
  }

  const updateCancelField = <K extends keyof CancelServiceFormState>(
    field: K,
    value: CancelServiceFormState[K]
  ) => {
    setCancelForm((prev) => {
      if (!prev) return prev

      const next: CancelServiceFormState = {
        ...prev,
        [field]: value,
      }

      if (field === 'total' || field === 'totalPaid') {
        const recalculatedDebt = Math.max(
          parseNonNegative(next.total) - parseNonNegative(next.totalPaid),
          0
        )
        next.debt = numberToInputValue(recalculatedDebt)
      }

      if (field === 'hasRefund' && value === 'NO') {
        next.refundMethod = ''
        next.cashFromBox = ''
        next.bankAccount = ''
        next.bankFromBox = ''
        next.sourceBoxName = ''
      }

      if (field === 'refundMethod' && value === 'CASH') {
        next.bankAccount = ''
        next.bankFromBox = ''
      }

      if (field === 'refundMethod' && value === 'BANK') {
        next.cashFromBox = ''
      }

      return next
    })
  }

  const handleAutofillCancelTotals = () => {
    const computedDebt = Math.max(totalBudget - totalAdvance, 0)
    setCancelForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        total: numberToInputValue(totalBudget),
        totalPaid: numberToInputValue(totalAdvance),
        debt: numberToInputValue(computedDebt),
        amount: numberToInputValue(computedDebt),
      }
    })
  }

  const validateCancelForm = (state: CancelServiceFormState) => {
    if (!state.statusId) {
      return t('services:action-modal.cancelSection.validation.statusRequired')
    }

    if (parseNonNegative(state.amount) <= 0) {
      return t('services:action-modal.cancelSection.validation.amountRequired')
    }

    if (state.hasRefund === '') {
      return t('services:action-modal.cancelSection.validation.hasRefundRequired')
    }

    if (state.hasRefund === 'YES' && !state.refundMethod) {
      return t('services:action-modal.cancelSection.validation.refundMethodRequired')
    }

    if (state.hasRefund === 'YES' && state.refundMethod === 'CASH') {
      if (state.cashFromBox === '') {
        return t('services:action-modal.cancelSection.validation.cashFromBoxRequired')
      }
      if (state.cashFromBox === 'YES' && !state.sourceBoxName.trim()) {
        return t('services:action-modal.cancelSection.validation.sourceBoxRequired')
      }
    }

    if (state.hasRefund === 'YES' && state.refundMethod === 'BANK') {
      if (!state.bankAccount.trim()) {
        return t('services:action-modal.cancelSection.validation.bankAccountRequired')
      }
      if (state.bankFromBox === '') {
        return t('services:action-modal.cancelSection.validation.bankFromBoxRequired')
      }
      if (state.bankFromBox === 'YES' && !state.sourceBoxName.trim()) {
        return t('services:action-modal.cancelSection.validation.sourceBoxRequired')
      }
    }

    return null
  }

  const handleCancelService = async () => {
    if (!formData || !cancelForm) return

    const validationError = validateCancelForm(cancelForm)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsCancellingService(true)
    try {
      const nextStatusId =
        cancelForm.statusId || resolveCancelStatusId(formData.serviceDetails.statusId) || ''

      const nextFormData: ServiceFormData = {
        ...formData,
        serviceDetails: {
          ...formData.serviceDetails,
          statusId: nextStatusId,
        },
      }

      const hasRefund = cancelForm.hasRefund === 'YES'
      const refundMethod = hasRefund ? cancelForm.refundMethod || null : null
      const cashFromBox = refundMethod === 'CASH' ? toBooleanValue(cancelForm.cashFromBox) : null
      const bankFromBox = refundMethod === 'BANK' ? toBooleanValue(cancelForm.bankFromBox) : null
      const shouldRequireSource =
        (refundMethod === 'CASH' && cashFromBox === true) ||
        (refundMethod === 'BANK' && bankFromBox === true)

      const payload: CreateServicePayload = {
        ...buildPayload(nextFormData),
        cancellation: {
          total: parseNonNegative(cancelForm.total),
          totalPaid: parseNonNegative(cancelForm.totalPaid),
          debt: parseNonNegative(cancelForm.debt),
          amount: parseNonNegative(cancelForm.amount),
          hasRefund,
          refundMethod,
          cashFromBox,
          bankAccount:
            refundMethod === 'BANK' ? cancelForm.bankAccount.trim() || null : null,
          bankFromBox,
          sourceBoxName: shouldRequireSource
            ? cancelForm.sourceBoxName.trim() || null
            : null,
          notes: cancelForm.notes.trim() || null,
        },
      }

      await updateService(serviceId, payload)

      setFormData(nextFormData)
      toast.success(t('services:action-modal.cancelSection.toasts.success'))
      onSaved()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('services:action-modal.cancelSection.toasts.error')))
    } finally {
      setIsCancellingService(false)
    }
  }

  const serviceQrCode = formData?.serviceDetails.qrCode || qrCode

  const tabs: Array<{
    id: ServiceActionTab
    label: string
    icon: ReactNode
  }> = [
    {
      id: 'info',
      label: t('services:action-modal.tabs.info'),
      icon: <ClipboardListIcon size={16} />,
    },
    {
      id: 'devices',
      label: t('services:action-modal.tabs.devices'),
      icon: <WrenchIcon size={16} />,
    },
    {
      id: 'service',
      label: t('services:action-modal.tabs.service'),
      icon: <Settings2Icon size={16} />,
    },
    {
      id: 'cancel',
      label: t('services:action-modal.tabs.cancel'),
      icon: <BanIcon size={16} />,
    },
    {
      id: 'evidence',
      label: t('services:action-modal.tabs.evidence'),
      icon: <QrCodeIcon size={16} />,
    },
  ]

  const renderInfoTab = () => {
    if (!formData) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('services:action-modal.labels.clientInfo')}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">
                  {t('services:first-step.labelInput.newLabelUserName')}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formData.client?.name || t('services:action-modal.empty.na')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  {t('services:first-step.labelInput.newLabelUserPhone')}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formData.client?.phone || t('services:action-modal.empty.na')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  {t('services:first-step.labelInput.newLabelUserEmail')}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formData.client?.email || t('services:action-modal.empty.na')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  {t('services:first-step.labelInput.newLabelUserAddress')}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formData.client?.address || t('services:action-modal.empty.na')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('services:action-modal.labels.statusCard')}
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                <span className="text-gray-500">
                  {t('services:third-step.labelInput.initialStatus')}:
                </span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {statusNameById.get(formData.serviceDetails.statusId) ||
                    t('services:action-modal.empty.na')}
                </span>
              </p>
              <p>
                <span className="text-gray-500">{t('common:others.branch')}:</span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {branchNameById.get(formData.serviceDetails.branchId) ||
                    t('services:action-modal.empty.na')}
                </span>
              </p>
              <p>
                <span className="text-gray-500">
                  {t('services:action-modal.labels.reception')}:
                </span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formData.serviceDetails.receptionDate ||
                    t('services:action-modal.empty.na')}
                </span>
              </p>
              <p>
                <span className="text-gray-500">
                  {t('services:action-modal.labels.budget')}:
                </span>{' '}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  ${totalBudget.toFixed(2)}
                </span>
              </p>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t('services:action-modal.labels.registeredDevices')}
          </h3>
          <div className="mt-3 space-y-2">
            {formData.devices.map((device, index) => (
              <div
                key={device.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  #{index + 1} {device.brand} {device.model}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('services:action-modal.infoSection.deviceSummary', {
                    type:
                      deviceTypeNameById.get(device.deviceTypeId) ||
                      t('services:action-modal.empty.withoutType'),
                    technician:
                      technicianNameById.get(device.technicianId) ||
                      t('services:action-modal.empty.withoutTechnician'),
                    location:
                      locationNameById.get(device.locationId) ||
                      t('services:action-modal.empty.withoutLocation'),
                  })}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  const renderDevicesTab = () => {
    if (!formData) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('services:action-modal.deviceSection.description')}
          </p>
          <Button
            type="button"
            variant="outline"
            icon={<PlusIcon size={16} />}
            onClick={handleAddDevice}
          >
            {t('services:action-modal.deviceSection.addDevice')}
          </Button>
        </div>

        <div className="space-y-4">
          {formData.devices.map((device, index) => (
            <Card
              key={device.id}
              id={`device-card-${device.id}`}
              className={`p-4 transition-colors duration-300 ${
                lastAddedDeviceId === device.id
                  ? 'ring-2 ring-indigo-200 dark:ring-indigo-500/40'
                  : ''
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('services:action-modal.deviceSection.deviceNumber', {
                    number: index + 1,
                  })}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Trash2Icon size={14} />}
                  onClick={() => handleRemoveDevice(device.id)}
                >
                  {t('services:action-modal.deviceSection.removeDevice')}
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newLabelTypeDevice')}
                  </label>
                  <Select
                    value={device.deviceTypeId}
                    onValueChange={(value) =>
                      updateDeviceField(device.id, 'deviceTypeId', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t('services:action-modal.placeholders.deviceType')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogs.deviceTypes.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newLabelBrand')}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.brand}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'brand', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newLabelModel')}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.model}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'model', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newLabelSerialNumber')}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.serialNumber}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'serialNumber', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newLabelColor')}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.color}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'color', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newLabelAppearance')}
                  </label>
                  <input
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.appearance}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'appearance', event.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:action-modal.labels.problem')}
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.problem}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'problem', event.target.value)
                    }
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newLabelSolutionDetail')}
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.solution}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'solution', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newCostRepair')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.cost}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'cost', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newAdvance')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.advance}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'advance', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newAssignedTechnician')}
                  </label>
                  <Select
                    value={device.technicianId}
                    onValueChange={(value) =>
                      updateDeviceField(device.id, 'technicianId', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t('services:action-modal.placeholders.technician')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogs.technicians.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newLocation')}
                  </label>
                  <Select
                    value={device.locationId}
                    onValueChange={(value) =>
                      updateDeviceField(device.id, 'locationId', value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t('services:action-modal.placeholders.location')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogs.locations.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newEstimateDate')}
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.deliveryDate}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'deliveryDate', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    {t('services:second-step.newDevice.labelInput.newEstimateTime')}
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    value={device.deliveryTime}
                    onChange={(event) =>
                      updateDeviceField(device.id, 'deliveryTime', event.target.value)
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const renderServiceTab = () => {
    if (!formData) return null

    return (
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              {t('common:others.branch')}
            </label>
            <Select
              value={formData.serviceDetails.branchId}
              onValueChange={(value) => updateServiceField('branchId', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t('services:action-modal.placeholders.branch')}
                />
              </SelectTrigger>
              <SelectContent>
                {catalogs.branches.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              {t('services:third-step.labelInput.initialStatus')}
            </label>
            <Select
              value={formData.serviceDetails.statusId}
              onValueChange={(value) => updateServiceField('statusId', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t('services:action-modal.placeholders.status')}
                />
              </SelectTrigger>
              <SelectContent>
                {catalogs.statuses.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              {t('services:third-step.labelInput.dateReception')}
            </label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formData.serviceDetails.receptionDate}
              onChange={(event) =>
                updateServiceField('receptionDate', event.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              {t('services:third-step.labelInput.serviceCode')}
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
              value={formData.serviceDetails.code}
              readOnly
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-gray-500">
              {t('services:third-step.labelInput.observations')}
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={formData.serviceDetails.observations}
              onChange={(event) =>
                updateServiceField('observations', event.target.value)
              }
            />
          </div>
        </div>
      </Card>
    )
  }

  const renderCancelTab = () => {
    if (!formData || !cancelForm) return null

    const isRefundEnabled = cancelForm.hasRefund === 'YES'
    const isRefundCash = isRefundEnabled && cancelForm.refundMethod === 'CASH'
    const isRefundBank = isRefundEnabled && cancelForm.refundMethod === 'BANK'
    const shouldShowSourceBox =
      (isRefundCash && cancelForm.cashFromBox === 'YES') ||
      (isRefundBank && cancelForm.bankFromBox === 'YES')
    const disableActions = isSaving || isClosingService || isCancellingService

    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-gray-500">
                {t('services:action-modal.cancelSection.labels.client')}
              </label>
              <input
                type="text"
                readOnly
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                value={formData.client?.name || t('services:action-modal.clientUnavailable')}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('services:action-modal.cancelSection.labels.currentStatus')}
              </label>
              <input
                type="text"
                readOnly
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                value={
                  statusNameById.get(formData.serviceDetails.statusId) ||
                  t('services:action-modal.empty.na')
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('services:action-modal.cancelSection.labels.total')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                value={cancelForm.total}
                onChange={(event) => updateCancelField('total', event.target.value)}
                disabled={disableActions}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('services:action-modal.cancelSection.labels.totalPaid')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                value={cancelForm.totalPaid}
                onChange={(event) => updateCancelField('totalPaid', event.target.value)}
                disabled={disableActions}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('services:action-modal.cancelSection.labels.debt')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
                value={cancelForm.debt}
                readOnly
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleAutofillCancelTotals}
              disabled={disableActions}
            >
              {t('services:action-modal.cancelSection.autofill')}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('services:action-modal.cancelSection.labels.amount')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                value={cancelForm.amount}
                onChange={(event) => updateCancelField('amount', event.target.value)}
                disabled={disableActions}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('services:action-modal.cancelSection.labels.cancelStatus')}
              </label>
              <Select
                value={cancelForm.statusId}
                onValueChange={(value) => updateCancelField('statusId', value)}
                disabled={disableActions}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t('services:action-modal.cancelSection.placeholders.status')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {catalogs.statuses.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              {t('services:action-modal.cancelSection.labels.hasRefund')}
            </label>
            <Select
              value={cancelForm.hasRefund}
              onValueChange={(value) =>
                updateCancelField('hasRefund', value as YesNoValue)
              }
              disabled={disableActions}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t(
                    'services:action-modal.cancelSection.placeholders.hasRefund'
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YES">
                  {t('services:action-modal.cancelSection.options.yes')}
                </SelectItem>
                <SelectItem value="NO">
                  {t('services:action-modal.cancelSection.options.no')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isRefundEnabled && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {t('services:action-modal.cancelSection.labels.refundMethod')}
              </label>
              <Select
                value={cancelForm.refundMethod}
                onValueChange={(value) =>
                  updateCancelField('refundMethod', value as RefundMethod)
                }
                disabled={disableActions}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t(
                      'services:action-modal.cancelSection.placeholders.refundMethod'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">
                    {t('services:action-modal.cancelSection.options.cash')}
                  </SelectItem>
                  <SelectItem value="BANK">
                    {t('services:action-modal.cancelSection.options.bank')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isRefundCash && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  {t('services:action-modal.cancelSection.labels.cashFromBox')}
                </label>
                <Select
                  value={cancelForm.cashFromBox}
                  onValueChange={(value) =>
                    updateCancelField('cashFromBox', value as YesNoValue)
                  }
                  disabled={disableActions}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t(
                        'services:action-modal.cancelSection.placeholders.cashFromBox'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">
                      {t('services:action-modal.cancelSection.options.yes')}
                    </SelectItem>
                    <SelectItem value="NO">
                      {t('services:action-modal.cancelSection.options.no')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {isRefundBank && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  {t('services:action-modal.cancelSection.labels.bankAccount')}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  value={cancelForm.bankAccount}
                  onChange={(event) =>
                    updateCancelField('bankAccount', event.target.value)
                  }
                  placeholder={t(
                    'services:action-modal.cancelSection.placeholders.bankAccount'
                  )}
                  disabled={disableActions}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  {t('services:action-modal.cancelSection.labels.bankFromBox')}
                </label>
                <Select
                  value={cancelForm.bankFromBox}
                  onValueChange={(value) =>
                    updateCancelField('bankFromBox', value as YesNoValue)
                  }
                  disabled={disableActions}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t(
                        'services:action-modal.cancelSection.placeholders.bankFromBox'
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">
                      {t('services:action-modal.cancelSection.options.yes')}
                    </SelectItem>
                    <SelectItem value="NO">
                      {t('services:action-modal.cancelSection.options.no')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {shouldShowSourceBox && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {isRefundBank
                  ? t('services:action-modal.cancelSection.labels.boxBank')
                  : t('services:action-modal.cancelSection.labels.boxCash')}
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                value={cancelForm.sourceBoxName}
                onChange={(event) =>
                  updateCancelField('sourceBoxName', event.target.value)
                }
                placeholder={t('services:action-modal.cancelSection.placeholders.sourceBox')}
                disabled={disableActions}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              {t('services:action-modal.cancelSection.labels.notes')}
            </label>
            <textarea
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              value={cancelForm.notes}
              onChange={(event) => updateCancelField('notes', event.target.value)}
              placeholder={t('services:action-modal.cancelSection.placeholders.notes')}
              disabled={disableActions}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="default"
              className="bg-gray-900 hover:bg-black text-white focus:ring-gray-700"
              onClick={() => void handleCancelService()}
              disabled={disableActions}
            >
              {isCancellingService
                ? t('services:action-modal.cancelSection.buttons.cancelling')
                : t('services:action-modal.cancelSection.buttons.cancelService')}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const renderEvidenceTab = () => {
    const evidenceUrl = buildEvidencePageUrl(serviceQrCode)

    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('services:action-modal.evidenceSection.description')}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs break-all text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {evidenceUrl}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="default"
              icon={<QrCodeIcon size={16} />}
              onClick={() => setIsQrModalOpen(true)}
            >
              {t('services:action-modal.evidenceSection.showQr')}
            </Button>

            <Button
              type="button"
              variant="outline"
              icon={<ExternalLinkIcon size={16} />}
              onClick={() => window.open(evidenceUrl, '_blank', 'noopener,noreferrer')}
            >
              {t('services:action-modal.evidenceSection.openEvidence')}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return renderInfoTab()
      case 'devices':
        return renderDevicesTab()
      case 'service':
        return renderServiceTab()
      case 'cancel':
        return renderCancelTab()
      case 'evidence':
        return renderEvidenceTab()
      default:
        return null
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('services:action-modal.title', { code: serviceCode })}
        size="xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('services:action-modal.closeButton')}
            </Button>
            <Button
              type="button"
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
              icon={<CheckCircle2Icon size={16} />}
              onClick={handlePerformDelivery}
              disabled={
                isLoading ||
                isSaving ||
                isClosingService ||
                isCancellingService ||
                !formData
              }
            >
              {isClosingService
                ? t('services:action-modal.performingDeliveryButton')
                : t('services:action-modal.performDeliveryButton')}
            </Button>
            <Button
              type="button"
              variant="default"
              icon={<SaveIcon size={16} />}
              onClick={() => void handleSaveChanges()}
              disabled={
                isLoading ||
                isSaving ||
                isClosingService ||
                isCancellingService ||
                !formData
              }
            >
              {isSaving
                ? t('services:action-modal.savingButton')
                : t('services:action-modal.saveButton')}
            </Button>
          </>
        }
      >
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            {t('services:action-modal.loading')}
          </div>
        ) : !formData ? (
          <div className="py-8 text-center text-sm text-red-500">
            {t('services:action-modal.loadError')}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <UserIcon size={16} />
                <span>
                  {formData.client?.name || t('services:action-modal.clientUnavailable')}
                </span>
              </div>
              <div className="text-gray-500">
                {t('services:action-modal.qrLabel')}: {serviceQrCode || t('services:action-modal.empty.na')}
              </div>
            </div>

            {showCloseStatusPicker && (
              <Card className="border-amber-200 bg-amber-50/70 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('services:action-modal.closePicker.title')}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {t('services:action-modal.closePicker.description')}
                  </p>
                  <div className="max-w-sm">
                    <label className="mb-1 block text-xs text-gray-500">
                      {t('services:action-modal.labels.finalStatus')}
                    </label>
                    <Select
                      value={manualCloseStatusId}
                      onValueChange={setManualCloseStatusId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t('services:action-modal.closePicker.statusPlaceholder')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogs.statuses.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="default"
                      className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                      icon={<CheckCircle2Icon size={16} />}
                      onClick={() => void runCloseService(manualCloseStatusId)}
                      disabled={
                        !manualCloseStatusId ||
                        isSaving ||
                        isClosingService ||
                        isCancellingService
                      }
                    >
                      {t('services:action-modal.closePicker.confirm')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCloseStatusPicker(false)
                        setManualCloseStatusId('')
                      }}
                      disabled={isSaving || isClosingService || isCancellingService}
                    >
                      {t('services:action-modal.closePicker.cancel')}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="max-h-[58vh] overflow-y-auto pr-1">{renderContent()}</div>
          </div>
        )}
      </Modal>

      {serviceQrCode && (
        <ServiceQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          qrCode={serviceQrCode}
          serviceCode={serviceCode}
          serviceRequestId={serviceId}
        />
      )}
    </>
  )
}
