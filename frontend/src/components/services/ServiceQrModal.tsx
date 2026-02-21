import { useEffect, useMemo, useState } from 'react'
import { CopyIcon, ExternalLinkIcon, QrCodeIcon } from 'lucide-react'
import QRCode from 'qrcode'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { buildEvidencePageUrl } from '@/lib/evidence'

interface ServiceQrModalProps {
  isOpen: boolean
  onClose: () => void
  qrCode: string
  serviceCode?: string
}

export const ServiceQrModal = ({
  isOpen,
  onClose,
  qrCode,
  serviceCode,
}: ServiceQrModalProps) => {
  const [qrImageDataUrl, setQrImageDataUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const evidenceUrl = useMemo(() => buildEvidencePageUrl(qrCode), [qrCode])

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
        console.error('No fue posible generar el QR:', error)
        setQrImageDataUrl('')
      } finally {
        setIsGenerating(false)
      }
    }

    void createQrImage()
  }, [evidenceUrl, isOpen, qrCode])

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(evidenceUrl)
    } catch (error) {
      console.error('No fue posible copiar la URL del QR:', error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`QR de evidencias${serviceCode ? ` - ${serviceCode}` : ''}`}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Escanea este código para abrir la página de evidencias y subir fotos.
        </p>

        <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          {isGenerating ? (
            <div className="flex h-[300px] w-[300px] items-center justify-center text-sm text-gray-500">
              Generando QR...
            </div>
          ) : qrImageDataUrl ? (
            <img
              src={qrImageDataUrl}
              alt="Código QR de evidencias"
              className="h-[300px] w-[300px] max-w-full"
            />
          ) : (
            <div className="flex h-[300px] w-[300px] items-center justify-center text-sm text-red-500">
              No se pudo generar el código QR.
            </div>
          )}
        </div>

        <div className="rounded-lg bg-gray-50 p-3 text-xs break-all text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {evidenceUrl}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            icon={<CopyIcon size={16} />}
            onClick={handleCopyUrl}
          >
            Copiar enlace
          </Button>
          <Button
            type="button"
            variant="default"
            icon={<ExternalLinkIcon size={16} />}
            onClick={() => window.open(evidenceUrl, '_blank', 'noopener,noreferrer')}
          >
            Abrir página
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={<QrCodeIcon size={16} />}
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
