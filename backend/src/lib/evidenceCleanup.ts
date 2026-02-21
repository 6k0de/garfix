import { addDays } from 'date-fns'
import { prisma } from './prisma.js'
import {
  deleteServiceEvidenceFolder,
  EVIDENCE_RETENTION_DAYS,
} from './evidenceStorage.js'

const TERMINAL_STATUS_KEYWORDS = [
  'completad',
  'terminad',
  'entregad',
  'finalizad',
]

const DEFAULT_CLEANUP_INTERVAL_MINUTES = 60
const DEFAULT_CLEANUP_MIN_INTERVAL_MINUTES = 10

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

const CLEANUP_INTERVAL_MS =
  parsePositiveInteger(
    process.env.EVIDENCE_CLEANUP_INTERVAL_MINUTES,
    DEFAULT_CLEANUP_INTERVAL_MINUTES,
    5,
    1440,
  ) *
  60 *
  1000

const CLEANUP_MIN_INTERVAL_MS =
  parsePositiveInteger(
    process.env.EVIDENCE_CLEANUP_MIN_INTERVAL_MINUTES,
    DEFAULT_CLEANUP_MIN_INTERVAL_MINUTES,
    1,
    180,
  ) *
  60 *
  1000

const normalizeStatusName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const isTerminalStatusName = (value: string) => {
  const normalized = normalizeStatusName(value)
  return TERMINAL_STATUS_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

interface TerminalStatusCache {
  ids: string[]
  expiresAt: number
}

let terminalStatusCache: TerminalStatusCache | null = null

const TERMINAL_STATUS_CACHE_TTL_MS = 5 * 60 * 1000

const getTerminalStatusIds = async () => {
  const now = Date.now()
  if (terminalStatusCache && terminalStatusCache.expiresAt > now) {
    return terminalStatusCache.ids
  }

  const statuses = await prisma.status.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const ids = statuses
    .filter((status) => isTerminalStatusName(status.name))
    .map((status) => status.id)

  terminalStatusCache = {
    ids,
    expiresAt: now + TERMINAL_STATUS_CACHE_TTL_MS,
  }

  return ids
}

const getEstimatedDeliveryDate = async (serviceRequestId: number) => {
  const result = await prisma.service.aggregate({
    where: { serviceRequestId },
    _max: {
      deliveryDate: true,
    },
  })

  return result._max.deliveryDate ?? null
}

const getEstimatedDeliveryDateByServiceRequest = async (serviceRequestIds: number[]) => {
  if (serviceRequestIds.length === 0) return new Map<number, Date>()

  const grouped = await prisma.service.groupBy({
    by: ['serviceRequestId'],
    where: {
      serviceRequestId: {
        in: serviceRequestIds,
      },
    },
    _max: {
      deliveryDate: true,
    },
  })

  const map = new Map<number, Date>()
  for (const item of grouped) {
    if (item._max.deliveryDate) {
      map.set(item.serviceRequestId, item._max.deliveryDate)
    }
  }

  return map
}

export interface EvidenceExpirationState {
  retentionDays: number
  terminalAt: Date | null
  expiresAt: Date | null
  expired: boolean
}

export const getServiceEvidenceExpirationState = async (
  serviceRequestId: number,
): Promise<EvidenceExpirationState> => {
  const [terminalStatusIds, serviceRequest, estimatedDeliveryDate] = await Promise.all([
    getTerminalStatusIds(),
    prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      select: {
        statusId: true,
      },
    }),
    getEstimatedDeliveryDate(serviceRequestId),
  ])

  if (!serviceRequest) {
    return {
      retentionDays: EVIDENCE_RETENTION_DAYS,
      terminalAt: null,
      expiresAt: null,
      expired: false,
    }
  }

  const isTerminalStatus = terminalStatusIds.includes(serviceRequest.statusId)

  if (!isTerminalStatus) {
    const projectedExpiresAt = estimatedDeliveryDate
      ? addDays(estimatedDeliveryDate, EVIDENCE_RETENTION_DAYS)
      : null

    return {
      retentionDays: EVIDENCE_RETENTION_DAYS,
      terminalAt: null,
      expiresAt: projectedExpiresAt,
      expired: false,
    }
  }

  const latestTerminalStatusHistory = await prisma.statusHistory.findFirst({
    where: {
      serviceRequestId,
      statusId: {
        in: terminalStatusIds,
      },
    },
    orderBy: {
      date: 'desc',
    },
    select: {
      date: true,
    },
  })

  const terminalAt = latestTerminalStatusHistory?.date ?? estimatedDeliveryDate
  if (!terminalAt) {
    return {
      retentionDays: EVIDENCE_RETENTION_DAYS,
      terminalAt: null,
      expiresAt: null,
      expired: false,
    }
  }

  const expiresAt = addDays(terminalAt, EVIDENCE_RETENTION_DAYS)

  return {
    retentionDays: EVIDENCE_RETENTION_DAYS,
    terminalAt,
    expiresAt,
    expired: Date.now() >= expiresAt.getTime(),
  }
}

export const clearEvidenceForService = async (serviceRequestId: number) => {
  const deleted = await prisma.attachment.deleteMany({
    where: {
      serviceRequestId,
    },
  })

  await deleteServiceEvidenceFolder(serviceRequestId)

  return deleted.count
}

export const clearEvidenceForServiceIfExpired = async (serviceRequestId: number) => {
  const state = await getServiceEvidenceExpirationState(serviceRequestId)
  if (!state.expired) {
    return {
      cleaned: false,
      deletedFiles: 0,
      state,
    }
  }

  const deletedFiles = await clearEvidenceForService(serviceRequestId)

  return {
    cleaned: true,
    deletedFiles,
    state,
  }
}

export interface EvidenceCleanupReport {
  startedAt: Date
  retentionDays: number
  candidates: number
  cleaned: number
  deletedAttachments: number
  skipped: boolean
}

let cleanupInFlight: Promise<EvidenceCleanupReport> | null = null
let cleanupStarted = false
let lastCleanupAt = 0

export const runEvidenceCleanup = async (
  force = false,
): Promise<EvidenceCleanupReport> => {
  if (cleanupInFlight) return cleanupInFlight

  const now = Date.now()
  if (!force && now - lastCleanupAt < CLEANUP_MIN_INTERVAL_MS) {
    return {
      startedAt: new Date(),
      retentionDays: EVIDENCE_RETENTION_DAYS,
      candidates: 0,
      cleaned: 0,
      deletedAttachments: 0,
      skipped: true,
    }
  }

  const job = (async () => {
    lastCleanupAt = Date.now()

    const terminalStatusIds = await getTerminalStatusIds()
    if (terminalStatusIds.length === 0) {
      return {
        startedAt: new Date(),
        retentionDays: EVIDENCE_RETENTION_DAYS,
        candidates: 0,
        cleaned: 0,
        deletedAttachments: 0,
        skipped: false,
      }
    }

    const terminalServiceRequests = await prisma.serviceRequest.findMany({
      where: {
        statusId: {
          in: terminalStatusIds,
        },
      },
      select: {
        id: true,
      },
    })

    if (terminalServiceRequests.length === 0) {
      return {
        startedAt: new Date(),
        retentionDays: EVIDENCE_RETENTION_DAYS,
        candidates: 0,
        cleaned: 0,
        deletedAttachments: 0,
        skipped: false,
      }
    }

    const terminalServiceRequestIds = terminalServiceRequests.map(
      (serviceRequest) => serviceRequest.id,
    )

    const [terminalHistories, estimatedDeliveryDateMap] = await Promise.all([
      prisma.statusHistory.groupBy({
        by: ['serviceRequestId'],
        where: {
          serviceRequestId: {
            in: terminalServiceRequestIds,
          },
          statusId: {
            in: terminalStatusIds,
          },
        },
        _max: {
          date: true,
        },
      }),
      getEstimatedDeliveryDateByServiceRequest(terminalServiceRequestIds),
    ])

    const terminalHistoryMap = new Map<number, Date>()
    for (const terminalHistory of terminalHistories) {
      if (terminalHistory._max.date) {
        terminalHistoryMap.set(terminalHistory.serviceRequestId, terminalHistory._max.date)
      }
    }

    const expiredCandidates = terminalServiceRequestIds.filter((serviceRequestId) => {
      const terminalAt =
        terminalHistoryMap.get(serviceRequestId) ??
        estimatedDeliveryDateMap.get(serviceRequestId)

      if (!terminalAt) return false

      const expiresAt = addDays(terminalAt, EVIDENCE_RETENTION_DAYS)
      return Date.now() >= expiresAt.getTime()
    })

    if (expiredCandidates.length === 0) {
      return {
        startedAt: new Date(),
        retentionDays: EVIDENCE_RETENTION_DAYS,
        candidates: 0,
        cleaned: 0,
        deletedAttachments: 0,
        skipped: false,
      }
    }

    let cleaned = 0
    let deletedAttachments = 0

    for (const serviceRequestId of expiredCandidates) {
      const deletedCount = await clearEvidenceForService(serviceRequestId)
      deletedAttachments += deletedCount
      cleaned += 1
    }

    return {
      startedAt: new Date(),
      retentionDays: EVIDENCE_RETENTION_DAYS,
      candidates: expiredCandidates.length,
      cleaned,
      deletedAttachments,
      skipped: false,
    }
  })().finally(() => {
    cleanupInFlight = null
  })

  cleanupInFlight = job
  return job
}

export const startEvidenceCleanupJob = () => {
  if (cleanupStarted) return

  cleanupStarted = true

  void runEvidenceCleanup(true).catch((error) => {
    console.error('Error en limpieza inicial de evidencias:', error)
  })

  const timer = setInterval(() => {
    void runEvidenceCleanup().catch((error) => {
      console.error('Error en limpieza programada de evidencias:', error)
    })
  }, CLEANUP_INTERVAL_MS)

  timer.unref?.()
}
