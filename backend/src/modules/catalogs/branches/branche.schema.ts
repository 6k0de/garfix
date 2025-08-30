import { z } from 'zod'

export const branchSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    address: z.string().trim().min(1, 'address is required'),
  })
  .strict()

export const updateBranchSchema = branchSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export type NewBranchInput = z.infer<typeof branchSchema>
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>
