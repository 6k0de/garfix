import { Router } from 'express'
import { authRequired } from '../../lib/auth.js'
import { loginLimiter, signupLimiter } from '../../lib/rateLimit.js'
import { verifyCaptcha } from '../../lib/captcha.js'
import * as authController from './auth.controller.js'

const authRoute = Router()

authRoute.post('/signup', signupLimiter, verifyCaptcha, authController.signup)
authRoute.post('/login', loginLimiter, authController.login)
authRoute.get('/me', authRequired, authController.me)
authRoute.post('/logout', authRequired, authController.logout)

export default authRoute
