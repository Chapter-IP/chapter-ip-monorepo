import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { CommonNotificationService } from './notification.service.js'
import { CommonNotification, CommonNotificationSchema } from './notification.schema.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: CommonNotification.name, schema: CommonNotificationSchema }])],
  controllers: [],
  providers: [CommonNotificationService],
  exports: [CommonNotificationService],
})
export class CommonNotificationModule {}
