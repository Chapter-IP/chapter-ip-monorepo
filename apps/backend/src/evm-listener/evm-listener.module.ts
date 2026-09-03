import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { EvmEventModelName, EvmEventSchema } from './evm-event.schema.js'
import { EvmEventService } from './evm-event.service.js'
import { EvmListenerService } from './evm-listener.service.js'
import { EvmSyncStateModelName, EvmSyncStateSchema } from './evm-sync-state.schema.js'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EvmEventModelName, schema: EvmEventSchema },
      { name: EvmSyncStateModelName, schema: EvmSyncStateSchema },
    ]),
  ],
  providers: [EvmEventService, EvmListenerService],
  exports: [EvmEventService],
})
export class EvmListenerModule {}
