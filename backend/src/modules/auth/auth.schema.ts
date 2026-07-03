import { z } from 'zod'

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(3, 'identifier is required'),
    password: z.string().min(8, 'password is required'),
  })
  .strict()

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'name is required'),
    email: z.string().trim().email('email is required'),
    username: z.string().trim().min(3).max(40).optional().nullable(),
    password: z.string().min(8, 'password is required'),
    companyName: z.string().trim().min(2, 'companyName is required'),
    subscriptionPlan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).default('BASIC'),
    initialBranchName: z.string().trim().optional().nullable(),
    initialBranchAddress: z.string().trim().optional().nullable(),
  })
  .strict()

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
