import { Module } from '@nestjs/common'

import { EvmListenerModule } from '../evm-listener/evm-listener.module.js'
import { ContentModule } from '../content/content.module.js'
import { PublisherModule } from '../publisher/publisher.module.js'

import { NotificationRouter } from './notification.router.js'
import { NotificationService } from './notification.service.js'

@Module({
  imports: [EvmListenerModule, ContentModule, PublisherModule],
  controllers: [],
  providers: [NotificationService, NotificationRouter],
})
export class NotificationModule {}
