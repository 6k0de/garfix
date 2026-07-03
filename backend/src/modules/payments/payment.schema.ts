import { z } from 'zod'
import { signupSchema } from '../auth/auth.schema.js'

export const billingCycleSchema = z.enum(['monthly', 'yearly']).default('monthly')

export const createSignupPaymentSchema = signupSchema.extend({
  billingCycle: billingCycleSchema,
})

export type CreateSignupPaymentInput = z.infer<typeof createSignupPaymentSchema>
