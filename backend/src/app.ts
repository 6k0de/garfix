import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import routes from './routes/routes.js'
import { startEvidenceCleanupJob } from './lib/evidenceCleanup.js'
import { EVIDENCE_STORAGE_ROOT } from './lib/evidenceStorage.js'

const app = express()

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
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
app.use('/api', routes)

startEvidenceCleanupJob()

const PORT = 3001
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
})
