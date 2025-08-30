import { Router } from 'express'
import * as s from './service.controller.ts'

const rs = Router()

rs.post('/create', s.createService)

export default rs