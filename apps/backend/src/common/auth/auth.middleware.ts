import { MiddlewareOptions, MiddlewareResponse, TRPCMiddleware } from 'nestjs-trpc'
import { TRPCError } from '@trpc/server'
import { Inject, Injectable, Logger } from '@nestjs/common'

import { CommonClientService } from '#backend/common/client/client.service.js'

import { CommonAuthService } from './auth.service.js'
import type { TAppContextWithTokenPayload, TAppContextClientAdmin } from './auth.types.js'

@Injectable()
export class AuthMiddleware implements TRPCMiddleware {
  private logger = new Logger(this.constructor.name)

  constructor(@Inject(CommonAuthService) private readonly commonAuthService: CommonAuthService) {}
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    try {
      const context = opts.ctx as TAppContextWithTokenPayload

      const authTokenHeader = context.req.headers?.['authorization'] ?? context.accessToken
      if (!authTokenHeader) {
        throw new TRPCError({ message: 'Missing authorization header', code: 'UNAUTHORIZED' })
      }

      const { token } = this.commonAuthService.extractToken(authTokenHeader)
      const tokenPayload = await this.commonAuthService.verifyToken(token, {})

      context.authTokenPayload = tokenPayload

      return opts.next({ ctx: context })
    } catch (err) {
      this.logger.error(err)
      throw new TRPCError({ message: (err as Error).message, code: 'UNAUTHORIZED' })
    }
  }
}

@Injectable()
export class AdminAuthMiddleware implements TRPCMiddleware {
  private logger = new Logger(this.constructor.name)

  constructor(@Inject(CommonClientService) private readonly commonClientService: CommonClientService) {}
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    try {
      const context = opts.ctx as TAppContextClientAdmin
      if (!context.clientInfo) {
        context.clientInfo = await this.commonClientService.getActiveClient()
      }

      if (
        context.clientInfo.owner_id !== context.authTokenPayload.sub &&
        !context.clientInfo.admins.includes(context.authTokenPayload.sub)
      ) {
        throw new Error('User is not the client admin')
      }

      return opts.next({ ctx: context })
    } catch (err) {
      this.logger.error(err)
      throw new TRPCError({ message: (err as Error).message, code: 'UNAUTHORIZED' })
    }
  }
}
