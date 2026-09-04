import type { HydratedDocument } from 'mongoose'

import { createMongooseSchema, withMongoose, z } from '#backend/common/mongoose/zod-mongoose.js'
import { ContentModelName } from '#backend/content/content.schema.js'

export const PurchaseHistoryItemSchemaDefinition = z.object({
  buyerAddress: z.string().trim().toLowerCase(),
  contentId: withMongoose(z.string(), { type: 'ObjectId', ref: ContentModelName }),
  licenseType: z.number(),
  priceFiat: z.string().optional(),
  txHash: z.string(),
  priceToken: z.string().optional(),
  priceEther: z.string().optional(),
  currencyTokenContract: z.string().trim().toLowerCase().optional(),
  platformFeeAmount: z.string().optional(),
  agencyFeeAmount: z.string().optional(),
  metadata: withMongoose(z.custom<Record<string, unknown>>().optional(), { type: 'Mixed' }),
  ownerId: z.string(),
})
export type PurchaseHistoryItem = z.infer<typeof PurchaseHistoryItemSchemaDefinition> & {
  id: string
  createdAt: Date
  updatedAt: Date
}
export type TPurchaseHistoryItemDocument = HydratedDocument<PurchaseHistoryItem>
export const PurchaseHistoryItemModelName = 'PurchaseHistoryItem'
export const PurchaseHistoryItemSchema = createMongooseSchema(PurchaseHistoryItemSchemaDefinition, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'purchase_history_items',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
PurchaseHistoryItemSchema.index({ buyerAddress: 1 })
PurchaseHistoryItemSchema.index({ contentId: 1 })
PurchaseHistoryItemSchema.index({ ownerId: 1 })
PurchaseHistoryItemSchema.index({ createdAt: 1 })
PurchaseHistoryItemSchema.index({ updatedAt: 1 })
