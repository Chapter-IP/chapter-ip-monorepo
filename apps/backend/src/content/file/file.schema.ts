import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Document, ObjectId, Schema as Mongooseschema, Types } from 'mongoose'

import { Content } from '../content.schema.js'

export type TContentFileDocument = HydratedDocument<ContentFile>

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'content_files',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
export class ContentFile extends Document<ObjectId> {
  declare id: string

  @Prop({ type: Types.ObjectId, ref: Content.name, required: true })
  declare contentId: string

  @Prop({ required: true, default: '' })
  declare label: string

  @Prop({ required: true })
  declare filename: string

  @Prop({ required: true })
  declare mimetype: string

  @Prop({ required: true })
  declare bucket: string

  @Prop({ required: true })
  declare key: string

  declare createdAt: Date
  declare updatedAt: Date
}

export const ContentFileSchema: Mongooseschema = SchemaFactory.createForClass(ContentFile)
ContentFileSchema.index({ key: 1, bucket: 1 }, { unique: true })
ContentFileSchema.index({ contentId: 1 })
ContentFileSchema.index({ createdAt: 1 })
ContentFileSchema.index({ updatedAt: 1 })
