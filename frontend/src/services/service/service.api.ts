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
