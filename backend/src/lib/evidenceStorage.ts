import { randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

const DEFAULT_UPLOAD_DIR = 'uploads/services'
const DEFAULT_RETENTION_DAYS = 1
const DEFAULT_MAX_FILES_PER_UPLOAD = 6
const DEFAULT_MAX_FILE_SIZE_MB = 10
const DEFAULT_MAX_WIDTH = 1920
const DEFAULT_MAX_HEIGHT = 1920
const DEFAULT_JPEG_QUALITY = 70

const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  if (parsed < min || parsed > max) return fallback
  return parsed
}

export const EVIDENCE_STORAGE_ROOT = path.resolve(
  process.cwd(),
  process.env.EVIDENCE_UPLOAD_DIR?.trim() || DEFAULT_UPLOAD_DIR,
)

export const EVIDENCE_PUBLIC_PREFIX = '/uploads/services'

export const EVIDENCE_RETENTION_DAYS = parsePositiveInteger(
  process.env.EVIDENCE_RETENTION_DAYS,
  DEFAULT_RETENTION_DAYS,
  1,
  30,
)

export const MAX_EVIDENCE_FILES_PER_UPLOAD = parsePositiveInteger(
  process.env.EVIDENCE_MAX_FILES_PER_UPLOAD,
  DEFAULT_MAX_FILES_PER_UPLOAD,
  1,
  20,
)

const MAX_EVIDENCE_FILE_SIZE_MB = parsePositiveInteger(
  process.env.EVIDENCE_MAX_FILE_SIZE_MB,
  DEFAULT_MAX_FILE_SIZE_MB,
  1,
  50,
)

export const MAX_EVIDENCE_FILE_SIZE_BYTES = MAX_EVIDENCE_FILE_SIZE_MB * 1024 * 1024

const EVIDENCE_MAX_WIDTH = parsePositiveInteger(
  process.env.EVIDENCE_MAX_WIDTH,
  DEFAULT_MAX_WIDTH,
  640,
  5000,
)

const EVIDENCE_MAX_HEIGHT = parsePositiveInteger(
  process.env.EVIDENCE_MAX_HEIGHT,
  DEFAULT_MAX_HEIGHT,
  640,
  5000,
)

const EVIDENCE_JPEG_QUALITY = parsePositiveInteger(
  process.env.EVIDENCE_JPEG_QUALITY,
  DEFAULT_JPEG_QUALITY,
  40,
  90,
)

export class EvidenceValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EvidenceValidationError'
  }
}

export const isSupportedEvidenceMimeType = (mimeType: string) =>
  SUPPORTED_MIME_TYPES.has(mimeType.toLowerCase())

export const getServiceEvidenceDirectory = (serviceRequestId: number) =>
  path.join(EVIDENCE_STORAGE_ROOT, String(serviceRequestId))

export const getServiceEvidencePublicPath = (
  serviceRequestId: number,
  fileName: string,
) => `${EVIDENCE_PUBLIC_PREFIX}/${serviceRequestId}/${fileName}`

export const ensureServiceEvidenceFolder = async (serviceRequestId: number) => {
  const folder = getServiceEvidenceDirectory(serviceRequestId)
  await fs.mkdir(folder, { recursive: true })
  return folder
}

export const deleteServiceEvidenceFolder = async (serviceRequestId: number) => {
  const folder = getServiceEvidenceDirectory(serviceRequestId)
  await fs.rm(folder, { recursive: true, force: true })
}

export const deleteStoredEvidenceFile = async (absolutePath: string) => {
  await fs.rm(absolutePath, { force: true })
}

export interface SavedEvidenceFile {
  fileName: string
  absolutePath: string
  publicPath: string
  originalBytes: number
  compressedBytes: number
}

export const compressAndStoreEvidence = async (
  serviceRequestId: number,
  file: Express.Multer.File,
): Promise<SavedEvidenceFile> => {
  if (!isSupportedEvidenceMimeType(file.mimetype)) {
    throw new EvidenceValidationError(
      'Solo se permiten archivos JPG, PNG o WEBP.',
    )
  }

  const serviceFolder = await ensureServiceEvidenceFolder(serviceRequestId)
  const image = sharp(file.buffer, { failOn: 'none' }).rotate()

  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height) {
    throw new EvidenceValidationError('El archivo enviado no parece ser una imagen válida.')
  }

  const compressedBuffer = await image
    .resize({
      width: EVIDENCE_MAX_WIDTH,
      height: EVIDENCE_MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: EVIDENCE_JPEG_QUALITY,
      mozjpeg: true,
      chromaSubsampling: '4:2:0',
    })
    .toBuffer()

  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.jpg`
  const absolutePath = path.join(serviceFolder, fileName)

  await fs.writeFile(absolutePath, compressedBuffer)

  return {
    fileName,
    absolutePath,
    publicPath: getServiceEvidencePublicPath(serviceRequestId, fileName),
    originalBytes: file.size,
    compressedBytes: compressedBuffer.byteLength,
  }
}
