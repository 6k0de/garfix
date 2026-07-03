import type { Request } from 'express'
import {
  getAuthContext,
  isSuperAdminRole,
  isTechnicianRole,
  type AuthContext,
} from './auth.js'
import { ensureDefaultCompany } from './defaultCatalogs.js'
import { prisma } from './prisma.js'

const normalizeCompanyId = (value: unknown) => {
  if (typeof value !== 'string') return null
  const parsed = value.trim()
  return parsed.length > 0 ? parsed : null
}

const extractCompanyIdFromQuery = (req: Request) => {
  const rawValue = req.query.companyId
  if (Array.isArray(rawValue)) {
    return normalizeCompanyId(rawValue[0])
  }
  return normalizeCompanyId(rawValue)
}

const extractBranchIdFromQuery = (req: Request) => {
  const rawValue = req.query.branchId
  if (Array.isArray(rawValue)) {
    return normalizeCompanyId(rawValue[0])
  }
  return normalizeCompanyId(rawValue)
}

export interface CompanyScope {
  auth: AuthContext
  isSuperAdmin: boolean
  isTechnician: boolean
  companyId: string
  branchId: string | null
}

export const resolveCompanyScope = async (req: Request): Promise<CompanyScope | null> => {
  const auth = getAuthContext(req)
  if (!auth) return null

  const isSuperAdmin = isSuperAdminRole(auth.role.name)
  const isTechnician = isTechnicianRole(auth.role.name)
  const requestedCompanyId = extractCompanyIdFromQuery(req)
  const requestedBranchId = extractBranchIdFromQuery(req)
  let effectiveBranchId = isTechnician
    ? auth.branchId ?? null
    : requestedBranchId ?? null

  if (!isSuperAdmin && !isTechnician && !effectiveBranchId && auth.company?.id) {
    const firstBranch = await prisma.branch.findFirst({
      where: {
        companyId: auth.company.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
      },
    })
    effectiveBranchId = firstBranch?.id ?? null
  }

  if (requestedCompanyId && isSuperAdmin) {
    return {
      auth,
      isSuperAdmin,
      isTechnician,
      companyId: requestedCompanyId,
      branchId: effectiveBranchId,
    }
  }

  if (auth.company?.id) {
    return {
      auth,
      isSuperAdmin,
      isTechnician,
      companyId: auth.company.id,
      branchId: effectiveBranchId,
    }
  }

  if (!isSuperAdmin) {
    return null
  }

  const fallbackCompany = await ensureDefaultCompany()
  return {
    auth,
    isSuperAdmin,
    isTechnician,
    companyId: fallbackCompany.id,
    branchId: effectiveBranchId,
  }
}
