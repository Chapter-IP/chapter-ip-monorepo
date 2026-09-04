import type { HydratedDocument } from 'mongoose'

import { createMongooseSchema, z } from '../common/mongoose/zod-mongoose.js'

export enum CashoutStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum CashoutPlatform {
  VENMO = 'venmo',
  CASHAPP = 'cashapp',
}

export const CashoutSchemaDefinition = z.object({
  sub: z.string(),
  amount: z.number().min(1),
  username: z.string(),
  platform: z.enum(CashoutPlatform),
  status: z.enum(CashoutStatus).default(CashoutStatus.PENDING),
  reason: z.string().optional(),
})
export type Cashout = z.infer<typeof CashoutSchemaDefinition> & {
  id: string
  createdAt: Date
  updatedAt: Date
}
export type TCashoutDocument = HydratedDocument<Cashout>
export const CashoutModelName = 'Cashout'
export const CashoutSchema = createMongooseSchema(CashoutSchemaDefinition, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'cashouts',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
CashoutSchema.index({ sub: 1 })
CashoutSchema.index({ status: 1 })
CashoutSchema.index({ sub: 1, status: 1 })
CashoutSchema.index({ createdAt: 1 })
CashoutSchema.index({ updatedAt: 1 })
