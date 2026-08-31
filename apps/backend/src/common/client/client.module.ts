import { Module } from '@nestjs/common'

import { CommonClientService } from './client.service.js'
import { ClientInfoMiddleware } from './client.middleware.js'

@Module({
  imports: [],
  controllers: [],
  providers: [CommonClientService, ClientInfoMiddleware],
  exports: [CommonClientService, ClientInfoMiddleware],
})
export class CommonClientModule {}
