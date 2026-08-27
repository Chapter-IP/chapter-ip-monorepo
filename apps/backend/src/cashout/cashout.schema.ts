import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Document, ObjectId, Schema as Mongooseschema } from 'mongoose'

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

export type TCashoutDocument = HydratedDocument<Cashout>

@Schema({
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
export class Cashout extends Document<ObjectId> {
  declare id: string

  @Prop({ required: true })
  declare sub: string

  @Prop({ required: true, min: 1 })
  declare amount: number

  @Prop({ required: true })
  declare username: string

  @Prop({ required: true, enum: CashoutPlatform })
  declare platform: CashoutPlatform

  @Prop({ required: true, enum: CashoutStatus, default: CashoutStatus.PENDING })
  declare status: CashoutStatus

  @Prop({ required: false })
  declare reason?: string

  declare createdAt: Date
  declare updatedAt: Date
}

export const CashoutSchema: Mongooseschema = SchemaFactory.createForClass(Cashout)
CashoutSchema.index({ sub: 1 })
CashoutSchema.index({ status: 1 })
CashoutSchema.index({ sub: 1, status: 1 })
CashoutSchema.index({ createdAt: 1 })
CashoutSchema.index({ updatedAt: 1 })
