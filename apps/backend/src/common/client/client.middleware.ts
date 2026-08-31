import { MiddlewareOptions, MiddlewareResponse, TRPCMiddleware } from 'nestjs-trpc'
import { TRPCError } from '@trpc/server'
import { Inject, Injectable, Logger } from '@nestjs/common'

import { CommonClientService } from './client.service.js'
import { TAppContextWithClientInfo } from './client.types.js'

@Injectable()
export class ClientInfoMiddleware implements TRPCMiddleware {
  private logger = new Logger(this.constructor.name)

  constructor(@Inject(CommonClientService) private readonly commonClientService: CommonClientService) {}
  async use(opts: MiddlewareOptions): Promise<MiddlewareResponse> {
    try {
      const context = opts.ctx as TAppContextWithClientInfo
      context.clientInfo = await this.commonClientService.getActiveClient()
      return opts.next({ ctx: context })
    } catch (err) {
      this.logger.error(err)
      throw new TRPCError({ message: (err as Error).message, code: 'PRECONDITION_FAILED' })
    }
  }
}
