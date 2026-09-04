import type { HydratedDocument } from 'mongoose'

import { createMongooseSchema, withMongoose, z } from '../common/mongoose/zod-mongoose.js'

export const PublisherFiatBalanceSchemaDefinition = z.object({
  available: z.number().min(0).default(0),
  pending: z.number().min(0).default(0),
})
export type PublisherFiatBalance = z.infer<typeof PublisherFiatBalanceSchemaDefinition>
export const PublisherFiatBalanceSchema = createMongooseSchema(PublisherFiatBalanceSchemaDefinition, { _id: false })

export const PublisherSchemaDefinition = z.object({
  sub: z.string(),
  title: z.string(),
  evmAddress: z.string().optional(),
  avatarUrl: z.string().optional(),
  fiatBalance: withMongoose(PublisherFiatBalanceSchemaDefinition.default({ available: 0, pending: 0 }), {
    type: PublisherFiatBalanceSchema,
    required: true,
  }),
})
export type Publisher = z.infer<typeof PublisherSchemaDefinition> & {
  id: string
  createdAt: Date
  updatedAt: Date
}
export type TPublisherDocument = HydratedDocument<Publisher>
export const PublisherModelName = 'Publisher'
export const PublisherSchema = createMongooseSchema(PublisherSchemaDefinition, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'publishers',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
PublisherSchema.index({ sub: 1 }, { unique: true })
PublisherSchema.index({ createdAt: 1 })
PublisherSchema.index({ updatedAt: 1 })
PublisherSchema.index({ title: 1 })
