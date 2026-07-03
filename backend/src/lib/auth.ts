import { createHash, randomBytes } from 'crypto'
import type { NextFunction, Request, Response } from 'express'
import { prisma } from './prisma.js'

const DEFAULT_TOKEN_TTL_DAYS = 7
const SUPERADMIN_ROLE_KEYS = new Set(['superadmin', 'super admin'])
const TECHNICIAN_ROLE_KEYS = new Set(['tecnico', 'tech'])

export const normalizeRoleKey = (roleName: string | null | undefined) =>
  (roleName ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const resolveTokenTtlMs = () => {
  const rawValue = Number(process.env.AUTH_TOKEN_TTL_DAYS ?? DEFAULT_TOKEN_TTL_DAYS)
  const safeValue = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : DEFAULT_TOKEN_TTL_DAYS
  return Math.round(safeValue * 24 * 60 * 60 * 1000)
}

export const ACCESS_TOKEN_TTL_MS = resolveTokenTtlMs()

export interface AuthContext {
  userId: string
  name: string
  email: string | null
  username: string | null
  branchId: string | null
  role: {
    id: string
    name: string
    code: string
    key: string
  }
  company: {
    id: string
    name: string
    status: string
    subscriptionPlan: string
    branchLimit: number
  } | null
}

export type RequestWithAuth = Request & {
  auth?: AuthContext
  authTokenHash?: string
}

export const isSuperAdminRole = (roleName: string | null | undefined) =>
  SUPERADMIN_ROLE_KEYS.has(normalizeRoleKey(roleName))

export const isTechnicianRole = (roleName: string | null | undefined) =>
  TECHNICIAN_ROLE_KEYS.has(normalizeRoleKey(roleName))

export const issueAccessToken = () => randomBytes(48).toString('base64url')

export const hashAccessToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

export const buildAccessTokenExpiration = () =>
  new Date(Date.now() + ACCESS_TOKEN_TTL_MS)

const extractBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) return null
  const [prefix, token] = authorizationHeader.split(' ')
  if (!prefix || !token) return null
  if (prefix.toLowerCase() !== 'bearer') return null
  return token.trim() || null
}

export const getAuthContext = (req: Request) =>
  (req as RequestWithAuth).auth ?? null

export const getAuthTokenHashFromRequest = (req: Request) =>
  (req as RequestWithAuth).authTokenHash ?? null

export const authRequired = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = extractBearerToken(req.headers.authorization)
  if (!token) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para continuar.',
    })
  }

  const tokenHash = hashAccessToken(token)

  try {
    const session = await prisma.authSession.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            branchId: true,
            isActive: true,
            role: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
                status: true,
                subscriptionPlan: true,
                branchLimit: true,
              },
            },
          },
        },
      },
    })

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return res.status(401).json({
        error: 'Sesión inválida',
        message: 'Tu sesión expiró o no es válida.',
      })
    }

    if (!session.user?.isActive) {
      return res.status(403).json({
        error: 'Cuenta inactiva',
        message: 'Tu cuenta no está activa.',
      })
    }

    const authContext: AuthContext = {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email ?? null,
      username: session.user.username ?? null,
      branchId: session.user.branchId ?? null,
      role: {
        id: session.user.role.id,
        name: session.user.role.name,
        code: session.user.role.code,
        key: normalizeRoleKey(session.user.role.name),
      },
      company: session.user.company
        ? {
            id: session.user.company.id,
            name: session.user.company.name,
            status: session.user.company.status,
            subscriptionPlan: session.user.company.subscriptionPlan,
            branchLimit: session.user.company.branchLimit,
          }
        : null,
    }

    const typedRequest = req as RequestWithAuth
    typedRequest.auth = authContext
    typedRequest.authTokenHash = session.tokenHash

    await prisma.authSession
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => undefined)

    next()
  } catch (error) {
    console.error('Error validando sesión:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
    })
  }
}

export const superAdminRequired = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuthContext(req)
  if (!auth) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Debes iniciar sesión para continuar.',
    })
  }

  // Autorización por código de rol global (SUPERADMIN), no por el nombre —que es
  // manipulable—. Defensa en profundidad frente a escalada de privilegios.
  if (auth.role.code !== 'SUPERADMIN') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Solo el perfil superadmin puede ejecutar esta acción.',
    })
  }

  next()
}
