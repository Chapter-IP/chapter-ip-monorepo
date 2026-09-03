import type { HydratedDocument } from 'mongoose'

import { createMongooseSchema, z } from '../../mongoose/zod-mongoose.js'

export const BlockedLicenseSchemaDefinition = z.object({
  tokenId: z.string(),
  subEvmAddress: z.string(),
  sub: z.string(),
})
export type BlockedLicense = z.infer<typeof BlockedLicenseSchemaDefinition> & {
  id: string
  createdAt: Date
  updatedAt: Date
}
export type TFileDocument = HydratedDocument<BlockedLicense>
export const BlockedLicenseModelName = 'BlockedLicense'
export const BlockedLicenseSchema = createMongooseSchema(BlockedLicenseSchemaDefinition, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'blocked_licenses',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
BlockedLicenseSchema.index({ tokenId: 1 })
BlockedLicenseSchema.index({ subEvmAddress: 1 })
BlockedLicenseSchema.index({ sub: 1 })
