import { useLayoutEffect, useRef, useState } from 'react'
import type { ElementType, ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Retraso en ms para escalonar (stagger) elementos de una misma sección. */
  delay?: number
  /** Etiqueta a renderizar (por defecto div); útil para mantener semántica. */
  as?: ElementType
}

/**
 * Revela su contenido con una animación al entrar en el viewport.
 *
 * A prueba de fallos: el contenido es visible por defecto y solo se "arma"
 * (se oculta para animar) cuando está claramente por debajo del viewport. Si el
 * navegador no soporta IntersectionObserver o el JS falla, todo permanece visible.
 * Usa useLayoutEffect para armar antes del primer pintado y evitar parpadeos.
 */
export const Reveal = ({ children, className = '', delay = 0, as }: RevealProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag: any = as ?? 'div'
  const ref = useRef<HTMLElement | null>(null)
  const [armed, setArmed] = useState(false)
  const [visible, setVisible] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight

    // Si ya está (casi) en pantalla, no lo ocultamos: se muestra de inmediato.
    if (rect.top < viewportHeight * 0.85) return

    setArmed(true)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const revealClass = armed ? (visible ? 'reveal is-visible' : 'reveal') : ''

  return (
    <Tag
      ref={ref}
      className={`${revealClass} ${className}`.trim()}
      style={armed && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}

export default Reveal
