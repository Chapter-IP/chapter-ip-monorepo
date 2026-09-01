import { Module } from '@nestjs/common'

import { CommonModelService } from './model.service.js'

@Module({
  imports: [],
  controllers: [],
  providers: [CommonModelService],
  exports: [CommonModelService],
})
export class CommonModelModule {}
