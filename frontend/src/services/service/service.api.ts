import { api } from '@/lib/api'
import type {
  CreateServicePayload,
  ServiceCatalogsResponse,
  ServiceDetailResponse,
  ServiceEvidenceResponse,
  ServiceListRecord,
  ServiceMutationResponse,
  UploadEvidenceResponse,
} from '@/pages/services/service.types'

export const createService = async (
  payload: CreateServicePayload
): Promise<ServiceMutationResponse> => {
  const { data } = await api.post('/services/create', payload)
  return data
}

export const getServiceCatalogs = async (): Promise<ServiceCatalogsResponse> => {
  const { data } = await api.get('/services/catalogs')
  return data
}

export const getAllServices = async (): Promise<ServiceListRecord[]> => {
  const { data } = await api.get('/services/select')
  return data
}

export interface CompanyOverview {
  branch: { id: string; name: string } | null
  summary: {
    totalRequests: number
    totalDevices: number
    totalQuoted: number
    totalCollected: number
    totalPending: number
    clientsCount: number
    requestsThisMonth: number
    collectedThisMonth: number
    quotedThisMonth: number
  }
  statusBreakdown: Array<{
    id: string
    name: string
    colorHex: string
    count: number
  }>
  recentRequests: Array<{
    id: number
    code: string
    client: string
    device: string
    devicesCount: number
    status: string
    statusColor: string
    receptionDate: string
    total: number
  }>
  topTechnicians: Array<{
    id: string
    name: string
    devices: number
    collected: number
  }>
  monthlyTrend: Array<{ month: string; label: string; count: number }>
}

export const getCompanyOverview = async (): Promise<CompanyOverview> => {
  const { data } = await api.get('/services/overview')
  return data
}

export interface ServiceTicketDevice {
  deviceType: string
  brand: string
  model: string
  color: string
  appearance: string
  unlockType: string
  unlockCode: string
  serialNumber: string
  problem: string
  solution: string
  technician: string
  cost: number
  advance: number
  debt: number
}

export interface ServiceTicket {
  folio: number
  code: string
  receptionDate: string
  observations: string
  company: { name: string }
  branch: { name: string; address: string }
  client: { name: string; phone: string; email: string; address: string }
  devices: ServiceTicketDevice[]
  totals: { total: number; paid: number; debt: number }
}

export const getServiceTicket = async (
  serviceRequestId: number | string,
): Promise<ServiceTicket> => {
  const { data } = await api.get(`/services/ticket/${serviceRequestId}`)
  return data
}

export const getServiceById = async (
  serviceRequestId: number | string
): Promise<ServiceDetailResponse> => {
  const { data } = await api.get(`/services/detail/${serviceRequestId}`)
  return data
}

export const updateService = async (
  serviceRequestId: number | string,
  payload: CreateServicePayload
): Promise<ServiceMutationResponse> => {
  const { data } = await api.put(`/services/update/${serviceRequestId}`, payload)
  return data
}

export const getServiceEvidenceByQr = async (
  qrCode: string
): Promise<ServiceEvidenceResponse> => {
  const { data } = await api.get(`/services/evidence/${encodeURIComponent(qrCode)}`)
  return data
}

export const uploadServiceEvidenceByQr = async (
  qrCode: string,
  files: File[]
): Promise<UploadEvidenceResponse> => {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))

  const { data } = await api.post(
    `/services/evidence/${encodeURIComponent(qrCode)}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )

  return data
}
