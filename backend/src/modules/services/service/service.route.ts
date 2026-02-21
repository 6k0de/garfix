import { NextFunction, Request, Response, Router } from 'express'
import multer from 'multer'
import * as s from './service.controller.js'
import {
    isSupportedEvidenceMimeType,
    MAX_EVIDENCE_FILES_PER_UPLOAD,
    MAX_EVIDENCE_FILE_SIZE_BYTES,
} from '../../../lib/evidenceStorage.js'

const rs = Router()
const uploadEvidence = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_EVIDENCE_FILE_SIZE_BYTES,
        files: MAX_EVIDENCE_FILES_PER_UPLOAD,
    },
    fileFilter: (_, file, callback) => {
        if (!isSupportedEvidenceMimeType(file.mimetype)) {
            callback(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'))
            return
        }
        callback(null, true)
    },
})

const evidenceUploadMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    uploadEvidence.array('images', MAX_EVIDENCE_FILES_PER_UPLOAD)(req, res, (error) => {
        if (!error) {
            next()
            return
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                res.status(400).json({
                    error: 'Archivo demasiado grande',
                    message: `Cada imagen puede pesar máximo ${Math.round(
                        MAX_EVIDENCE_FILE_SIZE_BYTES / 1024 / 1024,
                    )}MB.`,
                })
                return
            }

            res.status(400).json({
                error: 'Error al subir imágenes',
                message: error.message,
            })
            return
        }

        res.status(400).json({
            error: 'Archivo inválido',
            message: error.message,
        })
    })
}

rs.get('/select', s.getAllServices)
rs.get('/catalogs', s.getServiceCatalogs)
rs.get('/detail/:id', s.getServiceById)
rs.get('/evidence/:qrCode', s.getServiceEvidenceByQr)
rs.post('/create', s.createService)
rs.post('/evidence/:qrCode/upload', evidenceUploadMiddleware, s.uploadServiceEvidenceByQr)
rs.put('/update/:id', s.updateService)

export default rs
