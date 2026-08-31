import { Module } from '@nestjs/common'

import { CommonEvmService } from './evm.service.js'

@Module({
  imports: [],
  controllers: [],
  providers: [CommonEvmService],
  exports: [CommonEvmService],
})
export class CommonEvmModule {}
