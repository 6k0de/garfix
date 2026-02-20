import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const normalizeConnectionString = (value?: string) =>
  value?.trim().replace(/^['"]|['"]$/g, '') ?? ''

const resolveDatasourceUrl = () => {
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
    `Debes definir una URL válida en ${preferredVars.join(' o ')}.${detail}`
  )
}

const datasourceUrl = resolveDatasourceUrl()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: datasourceUrl,
  },
  migrations: {
    path: 'prisma/migrations',
  },
})
