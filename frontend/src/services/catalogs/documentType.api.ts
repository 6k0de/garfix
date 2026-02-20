import { api } from '@/lib/api.ts'
import type { DocumentTypePayload } from '@/pages/catalogs/DocumentTypes.tsx'

export const createDocumentType = async (payload: DocumentTypePayload) => {
  const { data } = await api.post('/document-types/create', payload)
  return data
}

export const getAllDocumentTypes = async () => {
  const { data } = await api.get('/document-types/select')
  return data
}

export const updateDocumentType = async (payload: DocumentTypePayload) => {
  const { status } = await api.put('/document-types/update', payload)
  return { status }
}

export const deleteDocumentType = async (id: string) => {
  const { status } = await api.delete(`/document-types/document-type/${id}`)
  return { status }
}
