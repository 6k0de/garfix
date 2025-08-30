import { z } from 'zod'

export const roleSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    description: z.string().trim().min(1, 'description is required'),
  })
  .strict()

export const updateRoleSchema = roleSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

export type NewRoleInput = z.infer<typeof roleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
