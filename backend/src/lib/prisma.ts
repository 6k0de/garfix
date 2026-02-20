import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const normalizeConnectionString = (value?: string) =>
  value?.trim().replace(/^['"]|['"]$/g, '') ?? ''

const resolveConnectionString = () => {
  const preferredVars =
    process.env.NODE_ENV === 'production'
      ? ['DATABASE_URL_PROD', 'DATABASE_URL']
      : ['DATABASE_URL', 'DATABASE_URL_PROD']

  const errors: string[] = []

  for (const envName of preferredVars) {
    const rawValue = process.env[envName]
    const normalized = normalizeConnectionString(rawValue)
    if (!normalized) continue

    try {
      const parsed = new URL(normalized)
      if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
        errors.push(`${envName}: protocolo no soportado (${parsed.protocol})`)
        continue
      }
      return normalized
    } catch (error) {
      errors.push(`${envName}: ${(error as Error).message}`)
    }
  }

  const detail = errors.length > 0 ? ` Detalles: ${errors.join(' | ')}` : ''
  throw new Error(
    `No se encontró una URL de base de datos válida en ${preferredVars.join(
      ' o ',
    )}.${detail}`,
  )
}

const connectionString = resolveConnectionString()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const resolveSslConfig = (dbUrl: string) => {
  const sslEnv = process.env.DATABASE_SSL?.trim().toLowerCase()

  if (sslEnv === 'false' || sslEnv === '0' || sslEnv === 'off' || sslEnv === 'no') {
    return false
  }

  if (sslEnv === 'true' || sslEnv === '1' || sslEnv === 'on' || sslEnv === 'yes') {
    return { rejectUnauthorized: false }
  }

  try {
    const parsed = new URL(dbUrl)
    const sslmode = parsed.searchParams.get('sslmode')?.toLowerCase()

    if (sslmode === 'disable' || sslmode === 'allow' || sslmode === 'prefer') {
      return false
    }

    if (
      sslmode === 'require' ||
      sslmode === 'verify-ca' ||
      sslmode === 'verify-full' ||
      sslmode === 'no-verify'
    ) {
      return { rejectUnauthorized: false }
    }

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return false
    }
  } catch {
    // Si no se puede parsear la URL aquí, dejamos el fallback por entorno.
  }

  return process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
}

const createClient = () => {
  const ssl = resolveSslConfig(connectionString)

  const pool = new Pool({
    connectionString,
    ssl,
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
