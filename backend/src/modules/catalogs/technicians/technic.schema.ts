import { z } from 'zod'

const passwordSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value
    const normalized = value.trim()
    return normalized.length > 0 ? normalized : undefined
  },
  z
    .string()
    .min(8, 'password must contain at least 8 characters')
    .max(72, 'password must contain at most 72 characters')
    .optional(),
)

// Convierte cadenas vacías en undefined para que el correo y el nombre de usuario
// sean realmente opcionales (sin chocar con el índice único cuando van vacíos).
const optionalIdentifier = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}, z.string().optional())

const technicBaseSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'name is required'),
    email: optionalIdentifier,
    username: optionalIdentifier,
    branchId: z.string().trim().min(1, 'branchId is required'),
    roleId: z.string(),
    password: passwordSchema,
  })
  .strict()

export const technicSchema = technicBaseSchema.refine(
  (data) => Boolean(data.email) || Boolean(data.username),
  {
    message: 'Debes proporcionar un correo electrónico o un nombre de usuario.',
    path: ['email'],
  },
)

export const updateTechnicScehma = technicBaseSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, 'id is required'),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'id'), {
    message: 'At least one field must be provided',
  })

export type NewTechnicInput = z.infer<typeof technicSchema>
export type UpdateTechnicInput = z.infer<typeof updateTechnicScehma>
