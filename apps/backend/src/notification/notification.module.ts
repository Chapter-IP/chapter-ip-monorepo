import { Module } from '@nestjs/common'

import { EvmListenerModule } from '../evm-listener/evm-listener.module'
import { ContentModule } from '../content/content.module'
import { PublisherModule } from '../publisher/publisher.module'

import { NotificationRouter } from './notification.router'
import { NotificationService } from './notification.service'

@Module({
  imports: [EvmListenerModule, ContentModule, PublisherModule],
  controllers: [],
  providers: [NotificationService, NotificationRouter],
})
export class NotificationModule {}
