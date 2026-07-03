const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')
const stripApiSuffix = (value: string) => value.replace(/\/api$/i, '')

/**
 * URL de la página pública de evidencias (a la que apunta el QR del servicio).
 * Es una ruta del FRONTEND (`/evidencias/:qrCode`), así que debe apuntar al sitio,
 * no al backend.
 *
 * - Por defecto usa el origen actual del navegador, así en producción toma
 *   automáticamente tu dominio (p. ej. https://app.garfix.mx) y en local el que
 *   estés usando (localhost, túnel, IP de tu red, etc.).
 * - Se puede forzar con `VITE_PUBLIC_APP_URL` si necesitas un dominio fijo distinto
 *   al de acceso (por ejemplo, para que el QR siempre apunte a producción).
 */
export const buildEvidencePageUrl = (qrCode: string) => {
  const configured = 'https://app.garfix.mx'
  const appBaseUrl = configured
    ? stripApiSuffix(normalizeBaseUrl(configured))
    : normalizeBaseUrl(
      typeof window !== 'undefined' ? window.location.origin : '',
    )

  return `${appBaseUrl}/evidencias/${encodeURIComponent(qrCode)}`
}
