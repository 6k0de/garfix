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
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop (solo visual) */}
      <div className="absolute inset-0 bg-black/50 z-40" aria-hidden="true" />

      {/* Contenedor centrado que CAPTURA el click afuera */}
      <div
        className="relative z-50 flex min-h-screen items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Contenido: detiene la propagación para no cerrar al click interno */}
        <div
          className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all animate-modalIn`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3
              className="text-lg font-medium text-gray-900 dark:text-white"
              id="modal-title"
            >
              {title}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar</span>
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="px-6 py-4">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
