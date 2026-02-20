import { create } from 'zustand'
import { getAllDocumentTypes } from '@/services/catalogs/documentType.api.ts'
import type { DocumentTypeRecord } from '@/pages/catalogs/DocumentTypes.tsx'

interface DocumentTypesState {
  documentTypes: DocumentTypeRecord[]
  fetchDocumentTypes: () => Promise<void>
}

export const useDocumentTypesStore = create<DocumentTypesState>((set) => ({
  documentTypes: [],
  fetchDocumentTypes: async () => {
    const data = await getAllDocumentTypes()
    set({ documentTypes: data })
  },
}))
