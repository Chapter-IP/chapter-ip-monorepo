import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { EvmEvent, EvmEventSchema } from './evm-event.schema'
import { EvmEventService } from './evm-event.service'
import { EvmListenerService } from './evm-listener.service'
import { EvmSyncState, EvmSyncStateSchema } from './evm-sync-state.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EvmEvent.name, schema: EvmEventSchema },
      { name: EvmSyncState.name, schema: EvmSyncStateSchema },
    ]),
  ],
  providers: [EvmEventService, EvmListenerService],
  exports: [EvmEventService],
})
export class EvmListenerModule {}
