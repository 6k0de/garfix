export interface CatalogOption {
  id: string
  name: string
  colorHex?: string
}

export interface ServiceClientRecord {
  id: string
  name: string
  phone: string
  email: string
  address: string
  typeClientId: string
  documentTypeId: string
  branchId: string
}

export interface TechnicianOption {
  id: string
  name: string
  email: string | null
  branchId: string | null
}

export interface LocationOption {
  id: string
  name: string
  branchId: string
}

export interface ServiceDeviceFormValue {
  id: string
  deviceTypeId: string
  brand: string
  model: string
  serialNumber: string
  color: string
  appearance: string
  unlockType: string
  unlockCode: string
  problem: string
  solution: string
  cost: string
  advance: string
  technicianId: string
  locationId: string
  deliveryDate: string
  deliveryTime: string
}

export interface NewClientFormValue {
  name: string
  phone: string
  email: string
  address: string
  typeClientId: string
  documentTypeId: string
  branchId: string
}

export interface ServiceDetailsFormValue {
  branchId: string
  receptionDate: string
  statusId: string
  observations: string
  code: string
  qrCode: string
}

export type RefundMethod = 'CASH' | 'BANK'

export interface ServiceCancellationPayload {
  total: number
  totalPaid: number
  debt: number
  amount: number
  hasRefund: boolean
  refundMethod?: RefundMethod | null
  cashFromBox?: boolean | null
  bankAccount?: string | null
  bankFromBox?: boolean | null
  sourceBoxName?: string | null
  notes?: string | null
}

export interface ServiceCancellationRecord extends ServiceCancellationPayload {
  id: string
  statusId: string
  refundMethod: RefundMethod | null
  cashFromBox: boolean | null
  bankAccount: string | null
  bankFromBox: boolean | null
  sourceBoxName: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ServiceFormData {
  client: ServiceClientRecord | null
  clientId: string | null
  newClient: NewClientFormValue | null
  devices: ServiceDeviceFormValue[]
  serviceDetails: ServiceDetailsFormValue
}

export interface ServiceCatalogsResponse {
  clients: ServiceClientRecord[]
  branches: CatalogOption[]
  statuses: CatalogOption[]
  deviceTypes: CatalogOption[]
  technicians: TechnicianOption[]
  locations: LocationOption[]
  typeClients: CatalogOption[]
  documentTypes: CatalogOption[]
}

export interface ServiceDeviceRecord {
  id: string
  deviceTypeId: string
  brand: string
  model: string
  serialNumber: string
  color: string
  appearance: string
  unlockType: string
  unlockCode: string
  problem: string
  solution: string
  cost: number
  advance: number
  technicianId: string
  locationId: string
  deliveryDate: string
  deliveryTime: string
}

export interface ServiceDetailResponse {
  id: number
  client: ServiceClientRecord
  devices: ServiceDeviceRecord[]
  serviceDetails: ServiceDetailsFormValue
  cancellation: ServiceCancellationRecord | null
}

export interface CreateServicePayload {
  clientId?: string | null
  newClient?: {
    name: string
    phone: string
    email?: string | null
    address?: string | null
    typeClientId?: string | null
    documentTypeId?: string | null
    branchId: string
  } | null
  devices: Array<{
    deviceTypeId: string
    brand: string
    model: string
    serialNumber?: string | null
    color?: string | null
    appearance?: string | null
    unlockType?: string | null
    unlockCode?: string | null
    problem: string
    solution?: string | null
    cost: number
    advance: number
    technicianId: string
    locationId: string
    deliveryDate?: string | null
    deliveryTime?: string | null
  }>
  serviceDetails: {
    branchId: string
    receptionDate: string
    statusId: string
    observations?: string | null
    code?: string | null
    qrCode?: string | null
  }
  cancellation?: ServiceCancellationPayload | null
}

export interface ServiceMutationResponse {
  id: number
  code: string
  qrCode: string
  clientId: string
  devicesCount: number
}

export interface ServiceListRecord {
  id: number
  code: string
  client: string
  device: string
  branch: string
  technician: string
  receptionDate: string
  status: string
  statusColor?: string
  qrCode: string
  devicesCount: number
}

export interface ServiceEvidenceAttachment {
  id: string
  url: string
  relativeUrl: string
  description: string | null
  createdAt: string
  originalBytes?: number
  compressedBytes?: number
}

export interface ServiceEvidenceResponse {
  serviceRequest: {
    id: number
    code: string
    qrCode: string
    receptionDate: string
    observations: string | null
    status: {
      id: string
      name: string
      colorHex?: string
    }
    branch: {
      id: string
      name: string
    }
    client: {
      id: string
      name: string
    }
  }
  evidence: {
    attachments: ServiceEvidenceAttachment[]
  }
  upload: {
    enabled: boolean
    maxFilesPerUpload: number
    fieldName: string
  }
  cleanupPolicy: {
    retentionDays: number
    terminalAt: string | null
    expiresAt: string | null
    expired: boolean
  }
}

export interface UploadEvidenceResponse {
  serviceRequest: {
    id: number
    code: string
    qrCode: string
  }
  uploadedCount: number
  attachments: ServiceEvidenceAttachment[]
}
