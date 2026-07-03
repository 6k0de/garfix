import z from 'zod'

export const loginSchema = z.object({
    identifier: z.string().min(3, 'Escribe tu correo o nombre de usuario').max(100, 'Demasiado largo'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
})

