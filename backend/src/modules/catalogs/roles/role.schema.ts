import { z } from 'zod'

export const roleSchema = z
  .object({
    id: z.string().optional(),
    code: z
      .string()
      .trim()
      .min(2, 'code is too short')
      .max(50, 'code is too long')
      .regex(/^[A-Z0-9_-]+$/, 'code format is invalid')
      .optional(),
    name: z.string().trim().min(1, 'name is required'),
    description: z.string().trim().optional(),
  })
  .strict()

export const updateRoleSchema = roleSchema
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

export type NewRoleInput = z.infer<typeof roleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
