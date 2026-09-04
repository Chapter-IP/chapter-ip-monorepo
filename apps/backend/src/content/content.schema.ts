import type { HydratedDocument } from 'mongoose'

import { createMongooseSchema, withMongoose, z } from '../common/mongoose/zod-mongoose.js'

export enum ContentStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SALE_DISABLED = 'SALE_DISABLED',
}

export const ContentSchemaDefinition = z.object({
  sub: z.string(),
  tokenId: z.string().optional(),
  contractAddress: z.string().trim().toLowerCase(),
  metadata: withMongoose(z.custom<Record<string, unknown>>().default({}), { type: 'Mixed' }),
  tags: withMongoose(z.array(z.string()).default([]), { required: false }),
  status: z.enum(ContentStatus).default(ContentStatus.ACTIVE),
})

export type Content = z.infer<typeof ContentSchemaDefinition> & {
  id: string
  createdAt: Date
  updatedAt: Date
}
export type TContentDocument = HydratedDocument<Content>
export const ContentModelName = 'Content'
export const ContentSchema = createMongooseSchema(ContentSchemaDefinition, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'contents',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
// zod-mongoose currently marks every array as required; preserve the previous optional Mongoose path.
ContentSchema.path('tags').required(false)
ContentSchema.index({ sub: 1 })
ContentSchema.index(
  { contractAddress: 1, tokenId: 1 },
  {
    unique: true,
    name: 'contractAddress_tokenId_unique_partial',
    partialFilterExpression: { tokenId: { $exists: true, $ne: null, $type: 'string' } },
  },
)
ContentSchema.index({ createdAt: 1 })
ContentSchema.index({ updatedAt: 1 })
ContentSchema.index({ tags: 1 })
ContentSchema.index({ 'metadata.$**': 1 })
