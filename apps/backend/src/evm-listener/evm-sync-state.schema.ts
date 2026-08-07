import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ collection: 'evm_sync_state' })
export class EvmSyncState extends Document {
  @Prop({ required: true, unique: true })
  name!: string

  @Prop({ required: true })
  lastProcessedBlock!: number
}

export const EvmSyncStateSchema = SchemaFactory.createForClass(EvmSyncState)
