import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Document, ObjectId, Schema as Mongooseschema } from 'mongoose'

export type TPublisherDocument = HydratedDocument<Publisher>

@Schema({ _id: false })
export class PublisherFiatBalance {
  @Prop({ required: true, default: 0, min: 0 })
  declare available: number

  @Prop({ required: true, default: 0, min: 0 })
  declare pending: number
}

export const PublisherFiatBalanceSchema = SchemaFactory.createForClass(PublisherFiatBalance)

@Schema({
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
export class Publisher extends Document<ObjectId> {
  declare id: string

  @Prop({ required: true })
  declare sub: string

  @Prop({ required: true })
  declare title: string

  @Prop({ required: false })
  declare evmAddress: string

  @Prop({ required: false })
  declare avatarUrl?: string

  @Prop({ type: PublisherFiatBalanceSchema, required: true, default: () => ({ available: 0, pending: 0 }) })
  declare fiatBalance: PublisherFiatBalance

  declare createdAt: Date
  declare updatedAt: Date
}

export const PublisherSchema: Mongooseschema = SchemaFactory.createForClass(Publisher)
PublisherSchema.index({ sub: 1 }, { unique: true })
PublisherSchema.index({ createdAt: 1 })
PublisherSchema.index({ updatedAt: 1 })
PublisherSchema.index({ title: 1 })
