import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import routes from './routes/routes.js'
import { startEvidenceCleanupJob } from './lib/evidenceCleanup.js'
import { EVIDENCE_STORAGE_ROOT } from './lib/evidenceStorage.js'
import { globalLimiter } from './lib/rateLimit.js'
import { assertProductionEnv } from './lib/security.js'

// Aborta el arranque si faltan secretos críticos en producción (fail-safe).
assertProductionEnv()

const app = express()

// Necesario para que el rate-limit lea la IP real detrás de un proxy/CDN.
app.set('trust proxy', 1)

// En producción, fuerza HTTPS redirigiendo el tráfico no seguro.
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
            return next()
        }
        return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`)
    })
}

const allowedOrigins = new Set(
    [
        "https://app.garfix.mx",
        "https://api.garfix.mx"

    ].filter((origin): origin is string => Boolean(origin)),
)

const corsOptions = {
    origin: (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
    ) => {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true)
            return
        }

        callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // La autenticación usa bearer tokens en cabecera, no cookies: no se necesitan credenciales.
    credentials: false,
}

app.use(cors(corsOptions))
app.options('/{*corsPath}', cors(corsOptions))
app.use(
    helmet({
        hsts: {
            maxAge: 31536000, // 1 año
            includeSubDomains: true,
            preload: true,
        },
    }),
)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '100kb' }))
app.use(
    '/uploads/services',
    express.static(EVIDENCE_STORAGE_ROOT, {
        setHeaders: (res) => {
            // Permite incrustar miniaturas desde el frontend aunque esté en otro origen.
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
            res.setHeader('Access-Control-Allow-Origin', '*')
        },
    }),
)
app.use('/api', globalLimiter, routes)

startEvidenceCleanupJob()

const PORT = 3001
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
