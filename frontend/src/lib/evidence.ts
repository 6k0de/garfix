const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '')
const stripApiSuffix = (value: string) => value.replace(/\/api$/i, '')

export const buildEvidencePageUrl = (qrCode: string) => {
  const configuredBase = import.meta.env.VITE_PUBLIC_APP_URL?.trim() ?? 'https://comparison-drops-relatives-unnecessary.trycloudflare.com'
  const appBaseUrl = configuredBase
    ? stripApiSuffix(normalizeBaseUrl(configuredBase))
    : normalizeBaseUrl(window.location.origin)

  return `${appBaseUrl}/evidencias/${encodeURIComponent(qrCode)}`
}
