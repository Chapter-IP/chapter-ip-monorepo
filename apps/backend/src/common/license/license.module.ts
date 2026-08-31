import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { BlockedLicenseService } from './blocked-license/blocked-license.service.js'
import { BlockedLicenseSchema, BlockedLicense } from './blocked-license/blocked-license.schema.js'

import { CommonLicenseService } from './license.service.js'

@Module({
  imports: [MongooseModule.forFeature([{ name: BlockedLicense.name, schema: BlockedLicenseSchema }])],
  controllers: [],
  providers: [CommonLicenseService, BlockedLicenseService],
  exports: [CommonLicenseService, BlockedLicenseService],
})
export class CommonLicenseModule {}
