import { useEffect, useMemo, useState } from 'react'
import { CopyIcon, ExternalLinkIcon, FileTextIcon, QrCodeIcon } from 'lucide-react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { buildEvidencePageUrl } from '@/lib/evidence'
import { getApiErrorMessage } from '@/lib/apiError'
import { getServiceTicket } from '@/services/service/service.api'
import {
  generateServiceTicketPdfBlob,
  preloadTicketPdfLibs,
} from '@/lib/serviceTicket'

interface ServiceQrModalProps {
  isOpen: boolean
  onClose: () => void
  qrCode: string
  serviceCode?: string
  serviceRequestId?: number | string
}

export const ServiceQrModal = ({
  isOpen,
  onClose,
  qrCode,
  serviceCode,
  serviceRequestId,
}: ServiceQrModalProps) => {
  const { t } = useTranslation(['services'])
  const [qrImageDataUrl, setQrImageDataUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handleGeneratePdf = async () => {
    if (!serviceRequestId || isGeneratingPdf) return

    // El loading vive dentro del sistema (spinner del botón + toast). Solo cuando el
    // PDF ya está generado se abre la ventana con el PDF (sin ventana en blanco ni
    // descarga). Las librerías se precargaron al abrir el modal, así la generación es
    // rápida y la nueva ventana no la bloquea el navegador.
    setIsGeneratingPdf(true)
    const toastId = toast.loading(t('services:qr-modal.generatingPdf'))
    try {
      const ticket = await getServiceTicket(serviceRequestId)
      const blob = await generateServiceTicketPdfBlob(ticket)
      toast.dismiss(toastId)

      const pdfWindow = window.open(URL.createObjectURL(blob), '_blank')
      if (!pdfWindow) toast.error(t('services:qr-modal.popupBlocked'))
    } catch (error) {
      console.error(error)
      toast.error(getApiErrorMessage(error, t('services:qr-modal.pdfError')), {
        id: toastId,
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const evidenceUrl = useMemo(() => buildEvidencePageUrl(qrCode), [qrCode])

  // Precargamos las librerías de PDF al abrir el modal, para que al pulsar "Generar
  // PDF" la generación sea rápida y la nueva ventana se abra sin bloqueo del navegador.
  useEffect(() => {
    if (isOpen && serviceRequestId) preloadTicketPdfLibs()
  }, [isOpen, serviceRequestId])

  useEffect(() => {
    if (!isOpen || !qrCode) return

    const createQrImage = async () => {
      setIsGenerating(true)
      try {
        const image = await QRCode.toDataURL(evidenceUrl, {
          width: 300,
          margin: 1,
          errorCorrectionLevel: 'M',
        })
        setQrImageDataUrl(image)
      } catch (error) {
        console.error(t('services:qr-modal.generateError'), error)
        setQrImageDataUrl('')
      } finally {
        setIsGenerating(false)
      }
    }

    void createQrImage()
  }, [evidenceUrl, isOpen, qrCode, t])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(evidenceUrl)
      toast.success(t('services:qr-modal.copySuccess'))
    } catch (error) {
      console.error(t('services:qr-modal.copyError'), error)
      toast.error(t('services:qr-modal.copyError'))
    }
  }

  const modalTitle = serviceCode
    ? t('services:qr-modal.titleWithCode', { code: serviceCode })
    : t('services:qr-modal.title')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t('services:qr-modal.description')}
        </p>

        <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          {isGenerating ? (
            <div className="flex aspect-square w-full max-w-[300px] items-center justify-center text-sm text-gray-500">
              {t('services:qr-modal.generating')}
            </div>
          ) : qrImageDataUrl ? (
            <img
              src={qrImageDataUrl}
              alt={t('services:qr-modal.imageAlt')}
              className="aspect-square w-full max-w-[300px] rounded-md object-contain"
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[300px] items-center justify-center text-sm text-red-500">
              {t('services:qr-modal.generateError')}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-gray-50 p-3 text-xs break-all text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {evidenceUrl}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {serviceRequestId && (
            <Button
              type="button"
              variant="default"
              icon={<FileTextIcon size={16} />}
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf
                ? t('services:qr-modal.generatingPdf')
                : t('services:qr-modal.generatePdf')}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            icon={<CopyIcon size={16} />}
            onClick={handleCopyUrl}
          >
            {t('services:qr-modal.copyLink')}
          </Button>
          <Button
            type="button"
            variant="outline"
            icon={<ExternalLinkIcon size={16} />}
            onClick={() => window.open(evidenceUrl, '_blank', 'noopener,noreferrer')}
          >
            {t('services:qr-modal.openPage')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={<QrCodeIcon size={16} />}
            onClick={onClose}
          >
            {t('services:qr-modal.close')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
