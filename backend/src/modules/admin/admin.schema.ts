import { z } from 'zod'

export const createAdminAccountSchema = z
  .object({
    name: z.string().trim().min(2, 'name is required'),
    email: z.string().trim().email('email is required'),
    username: z.string().trim().min(3).max(40).optional().nullable(),
    password: z.string().min(8, 'password is required'),
    companyName: z.string().trim().min(2, 'companyName is required'),
    subscriptionPlan: z.string().trim().min(1).default('BASIC'),
    subscriptionPrice: z.number().min(0).default(0),
    extraBranchPrices: z.array(z.number().min(0)).max(500).optional().default([]),
    status: z.string().trim().min(1).default('active'),
    branchLimit: z.number().int().min(1).max(500),
    initialBranchName: z.string().trim().optional().nullable(),
    initialBranchAddress: z.string().trim().optional().nullable(),
  })
  .strict()

export const updateSubscriptionSchema = z
  .object({
    subscriptionPlan: z.string().trim().min(1).optional(),
    subscriptionPrice: z.number().min(0).optional(),
    baseMonthlyPrice: z.number().min(0).optional(),
    extraBranchPrices: z.array(z.number().min(0)).max(500).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    status: z.string().trim().min(1).optional(),
    branchLimit: z.number().int().min(1).max(500).optional(),
    isAdminActive: z.boolean().optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field must be provided',
  })

export const createCompanyBranchSchema = z
  .object({
    name: z.string().trim().min(2, 'name is required'),
    address: z.string().trim().min(3, 'address is required'),
  })
  .strict()

export type CreateAdminAccountInput = z.infer<typeof createAdminAccountSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
export type CreateCompanyBranchInput = z.infer<typeof createCompanyBranchSchema>
