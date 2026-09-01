import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Document, ObjectId, Schema as Mongooseschema, Types } from 'mongoose'

import { Content } from '../content.schema.js'

export type TPurchaseHistoryItemDocument = HydratedDocument<PurchaseHistoryItem>

@Schema({
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
export class PurchaseHistoryItem extends Document<ObjectId> {
  declare id: string

  @Prop({ required: true, lowercase: true, trim: true })
  declare buyerAddress: string

  @Prop({ type: Types.ObjectId, ref: Content.name, required: true })
  declare contentId: string

  @Prop({ required: true })
  declare licenseType: number

  @Prop({ required: false })
  declare priceFiat: string

  @Prop({ required: true })
  declare txHash: string

  @Prop({ required: false })
  declare priceToken: string

  @Prop({ required: false })
  declare priceEther: string

  @Prop({ required: false, lowercase: true, trim: true })
  declare currencyTokenContract: string

  @Prop({ required: false })
  declare platformFeeAmount: string

  @Prop({ required: false })
  declare agencyFeeAmount: string

  @Prop({ type: Mongooseschema.Types.Mixed, required: false })
  declare metadata: Record<string, unknown>

  @Prop({ required: true })
  declare ownerId: string

  declare createdAt: Date
  declare updatedAt: Date
}

export const PurchaseHistoryItemSchema: Mongooseschema = SchemaFactory.createForClass(PurchaseHistoryItem)
PurchaseHistoryItemSchema.index({ buyerAddress: 1 })
PurchaseHistoryItemSchema.index({ contentId: 1 })
PurchaseHistoryItemSchema.index({ ownerId: 1 })
PurchaseHistoryItemSchema.index({ createdAt: 1 })
PurchaseHistoryItemSchema.index({ updatedAt: 1 })
