import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  AlertTriangleIcon,
  Clock3Icon,
  ImagePlusIcon,
  LoaderCircleIcon,
  RefreshCcwIcon,
  UploadIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import {
  getServiceEvidenceByQr,
  uploadServiceEvidenceByQr,
} from '@/services/service/service.api'
import { resolveApiAssetUrl } from '@/lib/api'
import type { ServiceEvidenceResponse } from './service.types'

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_CLIENT_FILE_SIZE_BYTES = 15 * 1024 * 1024

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleString()
}

export const ServiceEvidencePage = () => {
  const { qrCode: rawQrCode } = useParams<{ qrCode: string }>()

  const qrCode = useMemo(() => {
    if (!rawQrCode) return ''
    try {
      return decodeURIComponent(rawQrCode)
    } catch {
      return rawQrCode
    }
  }, [rawQrCode])

  const [data, setData] = useState<ServiceEvidenceResponse | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const loadEvidence = async () => {
    if (!qrCode) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await getServiceEvidenceByQr(qrCode)
      setData(response)
    } catch (error: any) {
      console.error(error)
      const message =
        error?.response?.data?.error ||
        'No fue posible cargar las evidencias para este QR.'
      toast.error(message)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEvidence()
  }, [qrCode])

  const maxFiles = data?.upload.maxFilesPerUpload ?? 1

  const handleFileSelection = (nextFiles: FileList | null) => {
    if (!nextFiles) {
      setSelectedFiles([])
      return
    }

    const validFiles = Array.from(nextFiles).filter((file) => {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        toast.error(`${file.name}: formato no soportado.`)
        return false
      }

      if (file.size > MAX_CLIENT_FILE_SIZE_BYTES) {
        toast.error(`${file.name}: excede 15MB.`)
        return false
      }

      return true
    })

    if (validFiles.length > maxFiles) {
      toast.error(`Solo puedes subir hasta ${maxFiles} imágenes por carga.`)
      setSelectedFiles(validFiles.slice(0, maxFiles))
      return
    }

    setSelectedFiles(validFiles)
  }

  const handleUpload = async () => {
    if (!qrCode || selectedFiles.length === 0) {
      toast.error('Selecciona al menos una imagen.')
      return
    }

    setIsUploading(true)
    try {
      const response = await uploadServiceEvidenceByQr(qrCode, selectedFiles)
      toast.success(`Se guardaron ${response.uploadedCount} evidencias.`)
      setSelectedFiles([])
      await loadEvidence()
    } catch (error: any) {
      console.error(error)
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'No fue posible subir las imágenes.'
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  const totalSelectedSize = selectedFiles.reduce((acc, file) => acc + file.size, 0)

  const getAttachmentAssetUrl = (attachment: ServiceEvidenceResponse['evidence']['attachments'][number]) => {
    const resourcePath = attachment.relativeUrl || attachment.url
    return resolveApiAssetUrl(resourcePath)
  }

  if (!qrCode) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-8">
        <Card className="mx-auto max-w-3xl p-6">
          <h1 className="text-xl font-bold text-gray-900">QR inválido</h1>
          <p className="mt-2 text-sm text-gray-600">
            El enlace de evidencias no contiene un código QR válido.
          </p>
          <Link to="/services/list" className="mt-5 inline-flex">
            <Button variant="default">Ir a servicios</Button>
          </Link>
        </Card>
      </div>
    )
  }

  console.log(data)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-6 sm:px-8">
      <Toaster />

      <div className="mx-auto max-w-6xl space-y-5">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Evidencias del servicio</h1>
              <p className="mt-1 text-sm text-gray-600">
                Usa esta página para subir y consultar el registro fotográfico del equipo.
              </p>
            </div>

            <Button
              variant="outline"
              icon={<RefreshCcwIcon size={16} />}
              onClick={() => void loadEvidence()}
              disabled={isLoading}
            >
              Actualizar
            </Button>
          </div>
        </Card>

        {isLoading ? (
          <Card className="p-10">
            <div className="flex items-center justify-center gap-3 text-gray-500">
              <LoaderCircleIcon className="animate-spin" size={20} />
              <span>Cargando información...</span>
            </div>
          </Card>
        ) : !data ? (
          <Card className="p-8">
            <div className="flex items-start gap-3 text-red-600">
              <AlertTriangleIcon size={20} className="mt-0.5" />
              <div>
                <h2 className="font-semibold">No fue posible cargar este servicio</h2>
                <p className="text-sm text-red-500">
                  Revisa que el QR sea correcto o solicita un nuevo enlace.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Folio</p>
                  <p className="text-sm font-semibold text-gray-900">{data.serviceRequest.code}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Cliente</p>
                  <p className="text-sm font-semibold text-gray-900">{data.serviceRequest.client.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Sucursal</p>
                  <p className="text-sm font-semibold text-gray-900">{data.serviceRequest.branch.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Estatus</p>
                  <p className="text-sm font-semibold text-gray-900">{data.serviceRequest.status.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Recepción</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(data.serviceRequest.receptionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">QR</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {data.serviceRequest.qrCode}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <Clock3Icon size={16} className="mt-0.5" />
                  <div>
                    <p>
                      Las evidencias se eliminan automáticamente {data.cleanupPolicy.retentionDays}{' '}
                      día(s) después de la fecha estimada de entrega, cuando el servicio esté en
                      estado final.
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Fecha límite detectada: {formatDate(data.cleanupPolicy.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900">Subir nuevas evidencias</h2>
              <p className="mt-1 text-sm text-gray-600">
                Máximo {data.upload.maxFilesPerUpload} imagen(es) por carga.
              </p>

              {!data.upload.enabled && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Este servicio ya expiró para carga de evidencias.
                </div>
              )}

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700" htmlFor="evidenceFiles">
                  Seleccionar imágenes
                </label>
                <input
                  id="evidenceFiles"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={!data.upload.enabled || isUploading}
                  onChange={(event) => handleFileSelection(event.target.files)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                />

                {selectedFiles.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFiles.length} archivo(s) seleccionado(s) - {formatBytes(totalSelectedSize)}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      {selectedFiles.map((file) => (
                        <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  type="button"
                  variant="default"
                  icon={
                    isUploading ? (
                      <LoaderCircleIcon size={16} className="animate-spin" />
                    ) : (
                      <UploadIcon size={16} />
                    )
                  }
                  disabled={!data.upload.enabled || isUploading || selectedFiles.length === 0}
                  onClick={() => void handleUpload()}
                >
                  {isUploading ? 'Subiendo imágenes...' : 'Guardar evidencias'}
                </Button>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Galería</h2>
                <span className="text-sm text-gray-500">
                  {data.evidence.attachments.length} imagen(es)
                </span>
              </div>

              {data.evidence.attachments.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  <ImagePlusIcon size={20} className="mx-auto mb-2" />
                  Aún no hay evidencias registradas para este servicio.
                </div>
              ) : (

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.evidence.attachments.map((attachment) => {
                    const assetUrl = getAttachmentAssetUrl(attachment)
                    return (
                      <a
                        key={attachment.id}
                        href={assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-lg border border-gray-200 bg-white"
                      >
                        <img
                          src={assetUrl}
                          alt={attachment.description || 'Evidencia del servicio'}
                          loading="lazy"
                          className="h-44 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="space-y-1 px-3 py-2">
                          <p className="truncate text-xs text-gray-700">
                            {attachment.description || 'Sin descripción'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {formatDate(attachment.createdAt)}
                          </p>
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
