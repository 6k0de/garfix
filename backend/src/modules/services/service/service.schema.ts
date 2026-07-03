import { z } from 'zod'

const uuidString = z.string().uuid()
const RefundMethodSchema = z.enum(['CASH', 'BANK'])

export const NewClientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  // Correo y dirección opcionales; se permite vacío.
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  // Tipo de cliente y tipo de documento opcionales (se validan contra la sucursal
  // en el controlador solo si vienen).
  typeClientId: z.string().optional().nullable(),
  documentTypeId: z.string().optional().nullable(),
  branchId: uuidString,
})

export const DeviceInputSchema = z.object({
  deviceTypeId: uuidString,
  brand: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  appearance: z.string().optional().nullable(),
  unlockType: z.string().optional().nullable(),
  unlockCode: z.string().optional().nullable(),
  problem: z.string().min(1),
  solution: z.string().optional().nullable(),
  cost: z.number().min(0),
  advance: z.number().min(0),
  technicianId: uuidString,
  locationId: uuidString,
  deliveryDate: z.string().optional().nullable(), // valida formato si quieres
  deliveryTime: z.string().optional().nullable(),
})

export const ServiceDetailsSchema = z.object({
  branchId: uuidString,
  receptionDate: z.string().min(1), // valida fecha si quieres con regexp
  statusId: uuidString,
  observations: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
})

export const CreateServicePayloadSchema = z.object({
  clientId: uuidString.optional().nullable(),
  newClient: NewClientSchema.optional().nullable(),
  devices: z.array(DeviceInputSchema).min(1),
  serviceDetails: ServiceDetailsSchema,
  cancellation: z
    .object({
      total: z.number().min(0),
      totalPaid: z.number().min(0),
      debt: z.number(),
      amount: z.number().min(0),
      hasRefund: z.boolean(),
      refundMethod: RefundMethodSchema.optional().nullable(),
      cashFromBox: z.boolean().optional().nullable(),
      bankAccount: z.string().optional().nullable(),
      bankFromBox: z.boolean().optional().nullable(),
      sourceBoxName: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (!data.hasRefund) {
        return
      }

      if (!data.refundMethod) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe indicar el método de reembolso.',
          path: ['refundMethod'],
        })
        return
      }

      if (data.refundMethod === 'CASH') {
        if (typeof data.cashFromBox !== 'boolean') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Debe indicar si el reembolso en efectivo sale de caja.',
            path: ['cashFromBox'],
          })
        }
        return
      }

      if (data.refundMethod === 'BANK') {
        if (!data.bankAccount?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Debe indicar la cuenta bancaria para el reembolso.',
            path: ['bankAccount'],
          })
        }
        if (typeof data.bankFromBox !== 'boolean') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Debe indicar si el reembolso por banco sale de caja.',
            path: ['bankFromBox'],
          })
        }
      }
    })
    .optional()
    .nullable(),
}).refine(
  (data) => Boolean(data.clientId || data.newClient),
  {
    message: 'Debe seleccionar un cliente existente o capturar uno nuevo.',
    path: ['clientId'],
  }
)

export type CreateServicePayload = z.infer<
  typeof CreateServicePayloadSchema
>
