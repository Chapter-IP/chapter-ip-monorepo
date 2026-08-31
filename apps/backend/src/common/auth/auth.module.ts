import { Module } from '@nestjs/common'

import { CommonAuthService } from './auth.service.js'
import { AuthMiddleware, AdminAuthMiddleware } from './auth.middleware.js'

@Module({
  imports: [],
  controllers: [],
  providers: [CommonAuthService, AuthMiddleware, AdminAuthMiddleware],
  exports: [CommonAuthService, AuthMiddleware, AdminAuthMiddleware],
})
export class CommonAuthModule {}
