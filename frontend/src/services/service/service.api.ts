import { api } from '@/lib/api'
import type {
  CreateServicePayload,
  ServiceCatalogsResponse,
  ServiceDetailResponse,
  ServiceListRecord,
} from '@/pages/services/service.types'

export const createService = async (payload: CreateServicePayload) => {
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
) => {
  const { data } = await api.put(`/services/update/${serviceRequestId}`, payload)
  return data
}
