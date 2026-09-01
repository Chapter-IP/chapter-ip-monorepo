import { Router, Query, UseMiddlewares, Ctx } from 'nestjs-trpc'
import { z } from 'zod'

import { AuthMiddleware, AdminAuthMiddleware } from './common/auth/auth.middleware.js'
import { CommonClientService } from './common/client/client.service.js'
import type { TAppContextWithTokenPayload } from './common/auth/auth.types.js'

import { healthOutputSchema } from './app.dto.js'
import type { TAppContext } from './app.context.js'
@Router({ alias: 'app' })
export class AppRouter {
  constructor(private readonly commonClientService: CommonClientService) {}

  @Query({ output: healthOutputSchema })
  health(@Ctx() ctx: TAppContext): {
    status: string
    timestamp: string
    requestId: string
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      requestId: ctx.requestId,
    }
  }

  @UseMiddlewares(AuthMiddleware)
  @Query({ output: z.any() })
  authTokenPayload(@Ctx() ctx: TAppContextWithTokenPayload): TAppContextWithTokenPayload['authTokenPayload'] {
    return ctx.authTokenPayload
  }

  @UseMiddlewares(AuthMiddleware, AdminAuthMiddleware)
  @Query({ output: z.boolean() })
  isClientAdmin(): boolean {
    return true
  }

  @UseMiddlewares(AuthMiddleware)
  @Query({ output: z.boolean() })
  async isClientAdminSafe(@Ctx() ctx: TAppContextWithTokenPayload): Promise<boolean> {
    try {
      return await this.commonClientService.verifySubIsClientAdmin(ctx.authTokenPayload.sub)
    } catch {
      return false
    }
  }
}
