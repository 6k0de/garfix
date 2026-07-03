import React, { useEffect } from 'react'
import { X as CloseIcon } from 'lucide-react'
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  if (!isOpen) return null

  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    // Solo cierra si el click fue EXACTAMENTE en este contenedor (no dentro del card)
    if (e.target === e.currentTarget) onClose()
  }
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.classList.add('overflow-hidden')
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen, onClose])
  if (!isOpen) return null
  const sizeClasses = {
    sm: 'max-w-full sm:max-w-md',
    md: 'max-w-full sm:max-w-lg',
    lg: 'max-w-full sm:max-w-2xl',
    xl: 'max-w-full sm:max-w-4xl',
  }
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop (solo visual) */}
      <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[1px]" aria-hidden="true" />

      {/* Contenedor centrado que CAPTURA el click afuera */}
      <div
        className="relative z-50 flex min-h-dvh items-end justify-center p-2 sm:min-h-screen sm:items-center sm:p-4"
        onClick={handleBackdropClick}
      >
        {/* Contenido: detiene la propagación para no cerrar al click interno */}
        <div
          className={`relative flex w-full ${sizeClasses[size]} max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl transform transition-all animate-modalIn sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl dark:bg-gray-800`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-gray-200 px-4 py-3 sm:items-center sm:px-6 sm:py-4 dark:border-gray-700">
            <h3
              className="pr-3 text-base font-medium text-gray-900 sm:text-lg dark:text-white"
              id="modal-title"
            >
              {title}
            </h3>
            <button
              type="button"
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 focus:outline-none dark:hover:bg-gray-700 dark:hover:text-gray-300"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar</span>
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>

          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-4 py-3 [&>*]:w-full sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4 sm:[&>*]:w-auto dark:border-gray-700">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
