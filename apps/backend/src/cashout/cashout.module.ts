import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { PublisherModule } from '../publisher/publisher.module.js'

import { CashoutModelName, CashoutSchema } from './cashout.schema.js'
import { CashoutService } from './cashout.service.js'
import { CashoutRouter } from './cashout.router.js'

@Module({
  imports: [PublisherModule, MongooseModule.forFeature([{ name: CashoutModelName, schema: CashoutSchema }])],
  controllers: [],
  providers: [CashoutService, CashoutRouter],
  exports: [CashoutService],
})
export class CashoutModule {}
