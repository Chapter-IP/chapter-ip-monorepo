import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { PublisherModule } from '../publisher/publisher.module'

import { Cashout, CashoutSchema } from './cashout.schema'
import { CashoutService } from './cashout.service'
import { CashoutRouter } from './cashout.router'

@Module({
  imports: [PublisherModule, MongooseModule.forFeature([{ name: Cashout.name, schema: CashoutSchema }])],
  controllers: [],
  providers: [CashoutService, CashoutRouter],
  exports: [CashoutService],
})
export class CashoutModule {}
