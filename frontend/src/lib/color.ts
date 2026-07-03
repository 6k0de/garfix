const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

export const DEFAULT_STATUS_COLOR_HEX = '#64748B'
const DEFAULT_DARK_TEXT_HEX = '#0F172A'
const DEFAULT_LIGHT_TEXT_HEX = '#FFFFFF'
const DEFAULT_LIGHT_SURFACE_HEX = '#FFFFFF'

const parseHexColor = (hexColor: string) => {
  const normalized = hexColor.trim().replace('#', '')
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return { red, green, blue }
}

export const isHexColor = (value: string | null | undefined): value is string => {
  if (typeof value !== 'string') return false
  return HEX_COLOR_REGEX.test(value.trim())
}

export const normalizeHexColor = (
  value: string | null | undefined,
  fallback = DEFAULT_STATUS_COLOR_HEX
) => {
  if (!isHexColor(value)) {
    return fallback
  }

  return value.trim().toUpperCase()
}

export const hexToRgba = (
  value: string | null | undefined,
  alpha = 1,
  fallback = DEFAULT_STATUS_COLOR_HEX
) => {
  const normalized = normalizeHexColor(value, fallback)
  const { red, green, blue } = parseHexColor(normalized)
  const safeAlpha = Math.max(0, Math.min(1, alpha))

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`
}

const toLinearChannel = (channelValue: number) => {
  const normalizedChannel = channelValue / 255
  if (normalizedChannel <= 0.03928) {
    return normalizedChannel / 12.92
  }
  return ((normalizedChannel + 0.055) / 1.055) ** 2.4
}

const getRelativeLuminance = (hexColor: string) => {
  const { red, green, blue } = parseHexColor(hexColor)
  return (
    0.2126 * toLinearChannel(red) +
    0.7152 * toLinearChannel(green) +
    0.0722 * toLinearChannel(blue)
  )
}

const getContrastRatio = (hexA: string, hexB: string) => {
  const luminanceA = getRelativeLuminance(hexA)
  const luminanceB = getRelativeLuminance(hexB)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)

  return (lighter + 0.05) / (darker + 0.05)
}

const rgbToHex = (red: number, green: number, blue: number) => {
  const safeChannel = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()

  return `#${safeChannel(red)}${safeChannel(green)}${safeChannel(blue)}`
}

export const blendHexOverSurface = (
  colorHex: string | null | undefined,
  alpha: number,
  surfaceHex: string | null | undefined = DEFAULT_LIGHT_SURFACE_HEX
) => {
  const sourceColor = normalizeHexColor(colorHex, DEFAULT_STATUS_COLOR_HEX)
  const surfaceColor = normalizeHexColor(surfaceHex, DEFAULT_LIGHT_SURFACE_HEX)
  const safeAlpha = Math.max(0, Math.min(1, alpha))
  const source = parseHexColor(sourceColor)
  const surface = parseHexColor(surfaceColor)

  return rgbToHex(
    source.red * safeAlpha + surface.red * (1 - safeAlpha),
    source.green * safeAlpha + surface.green * (1 - safeAlpha),
    source.blue * safeAlpha + surface.blue * (1 - safeAlpha)
  )
}

interface ReadableTextOptions {
  additionalBackgrounds?: Array<string | null | undefined>
  candidateTextColors?: Array<string | null | undefined>
}

export const getReadableTextColor = (
  value: string | null | undefined,
  fallback = DEFAULT_STATUS_COLOR_HEX,
  options: ReadableTextOptions = {}
) => {
  const backgrounds = [
    normalizeHexColor(value, fallback),
    ...(options.additionalBackgrounds ?? [])
      .filter((entry): entry is string => isHexColor(entry))
      .map((entry) => normalizeHexColor(entry, fallback)),
  ]

  const candidates = (options.candidateTextColors ?? [
    DEFAULT_DARK_TEXT_HEX,
    DEFAULT_LIGHT_TEXT_HEX,
  ])
    .filter((entry): entry is string => isHexColor(entry))
    .map((entry) => normalizeHexColor(entry, DEFAULT_DARK_TEXT_HEX))

  const safeCandidates =
    candidates.length > 0
      ? candidates
      : [DEFAULT_DARK_TEXT_HEX, DEFAULT_LIGHT_TEXT_HEX]

  let bestCandidate = safeCandidates[0]
  let bestMinContrast = -1

  for (const candidate of safeCandidates) {
    let minContrast = Number.POSITIVE_INFINITY

    for (const background of backgrounds) {
      const ratio = getContrastRatio(candidate, background)
      if (ratio < minContrast) {
        minContrast = ratio
      }
    }

    if (minContrast > bestMinContrast) {
      bestMinContrast = minContrast
      bestCandidate = candidate
    }
  }

  return bestCandidate
}

interface StatusTagStyleOptions {
  fillAlpha?: number
  borderAlpha?: number
  surfaceHex?: string
}

const DARK_SURFACE_HEX = '#1F2937' // gray-800: superficie (tarjeta) donde vive el chip

const isDarkMode = () =>
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')

export const getStatusTagStyle = (
  value: string | null | undefined,
  options: StatusTagStyleOptions = {}
) => {
  const dark = isDarkMode()
  const colorHex = normalizeHexColor(value, DEFAULT_STATUS_COLOR_HEX)
  // En oscuro: tinte más marcado y texto = color aclarado (brillante) para que
  // resalte sobre la tarjeta oscura. En claro: pastel suave con texto legible.
  const fillAlpha = Math.max(0, Math.min(1, options.fillAlpha ?? (dark ? 0.26 : 0.14)))
  const borderAlpha = Math.max(0, Math.min(1, options.borderAlpha ?? (dark ? 0.5 : 0.35)))
  const surfaceHex = normalizeHexColor(
    options.surfaceHex,
    dark ? DARK_SURFACE_HEX : DEFAULT_LIGHT_SURFACE_HEX
  )
  const background = blendHexOverSurface(colorHex, fillAlpha, surfaceHex)

  const lightenedColor = blendHexOverSurface('#FFFFFF', 0.55, colorHex)
  const color = dark
    ? getReadableTextColor(background, lightenedColor, {
        candidateTextColors: [lightenedColor, DEFAULT_LIGHT_TEXT_HEX],
      })
    : getReadableTextColor(background, colorHex, {
        candidateTextColors: [DEFAULT_DARK_TEXT_HEX, DEFAULT_LIGHT_TEXT_HEX],
      })

  return {
    backgroundColor: hexToRgba(colorHex, fillAlpha),
    borderColor: hexToRgba(colorHex, borderAlpha),
    color,
  }
}
