import { ExecutionContext, Injectable, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

@Injectable()
class AppThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    const { req, res } = super.getRequestResponse(context)
    res.header = res.setHeader.bind(res)
    return { req, res }
  }
}

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [],
      inject: [],
      useFactory: () => [
        {
          name: 'default',
          ttl: 60_000,
          limit: 120,
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class ThrottleModule {}
