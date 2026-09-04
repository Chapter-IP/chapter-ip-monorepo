import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { CommonNotificationService } from './notification.service.js'
import { CommonNotificationModelName, CommonNotificationSchema } from './notification.schema.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: CommonNotificationModelName, schema: CommonNotificationSchema }])],
  controllers: [],
  providers: [CommonNotificationService],
  exports: [CommonNotificationService],
})
export class CommonNotificationModule {}
