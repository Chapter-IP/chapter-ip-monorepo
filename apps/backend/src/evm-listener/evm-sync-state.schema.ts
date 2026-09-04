import { createMongooseSchema, withMongoose, z } from '#backend/common/mongoose/zod-mongoose.js'

export const EvmSyncStateSchemaDefinition = z.object({
  name: withMongoose(z.string(), { unique: true }),
  lastProcessedBlock: z.number(),
})
export type EvmSyncState = z.infer<typeof EvmSyncStateSchemaDefinition>
export const EvmSyncStateModelName = 'EvmSyncState'
export const EvmSyncStateSchema = createMongooseSchema(EvmSyncStateSchemaDefinition, {
  collection: 'evm_sync_state',
})
