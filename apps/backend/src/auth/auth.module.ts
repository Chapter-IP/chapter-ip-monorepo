import { Module } from '@nestjs/common'

import { AuthService } from './auth.service.js'
import { AuthRouter } from './auth.router.js'

@Module({
  imports: [],
  controllers: [],
  providers: [AuthService, AuthRouter],
})
export class AuthModule {}
