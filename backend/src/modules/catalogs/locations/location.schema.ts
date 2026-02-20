import { z } from 'zod'

export const locationSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    branchId: z.string().trim().min(1, 'branchId is required'),
    instructions: z.string().trim().optional(),
  })
  .strict()

export const updateLocationSchema = locationSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, 'id is required'),
  })
  .refine(
    (data) => Object.keys(data).some((key) => key !== 'id'),
    {
      message: 'At least one field must be provided',
    }
  )

export type NewLocationInput = z.infer<typeof locationSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
