import type { HydratedDocument } from 'mongoose'

import { createMongooseSchema, withMongoose, z } from '#backend/common/mongoose/zod-mongoose.js'
import { ContentModelName } from '#backend/content/content.schema.js'

export const ContentFileSchemaDefinition = z.object({
  contentId: withMongoose(z.string(), { type: 'ObjectId', ref: ContentModelName }),
  label: z.string().default(''),
  filename: z.string(),
  mimetype: z.string(),
  bucket: z.string(),
  key: z.string(),
})
export type ContentFile = z.infer<typeof ContentFileSchemaDefinition> & {
  id: string
  createdAt: Date
  updatedAt: Date
}
export type TContentFileDocument = HydratedDocument<ContentFile>
export const ContentFileModelName = 'ContentFile'
export const ContentFileSchema = createMongooseSchema(ContentFileSchemaDefinition, {
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
ContentFileSchema.index({ key: 1, bucket: 1 }, { unique: true })
ContentFileSchema.index({ contentId: 1 })
ContentFileSchema.index({ createdAt: 1 })
ContentFileSchema.index({ updatedAt: 1 })
