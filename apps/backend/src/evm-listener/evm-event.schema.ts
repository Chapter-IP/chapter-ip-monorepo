import type { HydratedDocument, Types } from 'mongoose'

import { createMongooseSchema, withMongoose, z } from '../common/mongoose/zod-mongoose.js'

export const EvmEventSchemaDefinition = z.object({
  contractAddress: z.string(),
  eventName: z.string(),
  blockNumber: z.number(),
  transactionHash: z.string(),
  logIndex: z.number(),
  args: withMongoose(
    z.custom<unknown>((value) => value !== undefined),
    { type: 'Mixed', required: true },
  ),
  raw: withMongoose(
    z.custom<unknown>((value) => value !== undefined),
    { type: 'Mixed', required: true },
  ),
})
export type EvmEvent = z.infer<typeof EvmEventSchemaDefinition> & { _id: Types.ObjectId }
export type TEvmEventDocument = HydratedDocument<EvmEvent>
export const EvmEventModelName = 'EvmEvent'
export const EvmEventSchema = createMongooseSchema(EvmEventSchemaDefinition, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'evm_events',
})
EvmEventSchema.index({ contractAddress: 1 })
EvmEventSchema.index({ eventName: 1 })
EvmEventSchema.index({ blockNumber: 1 })
EvmEventSchema.index({ transactionHash: 1 })
EvmEventSchema.index({ logIndex: 1 })
EvmEventSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true })
