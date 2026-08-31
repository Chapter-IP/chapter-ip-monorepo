import { Module, Global } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'

import { ThrottleModule } from './throttle/throttle.module.js'
import { CommonModelModule } from './model/model.module.js'
import { CommonClientModule } from './client/client.module.js'
import { CommonAuthModule } from './auth/auth.module.js'
import { CommonEvmModule } from './evm/evm.module.js'
import { CommonLicenseModule } from './license/license.module.js'
import { CommonNotificationModule } from './notification/notification.module.js'
import { BaseErrorFilter } from './error/base-error.filter.js'

@Global()
@Module({
  imports: [
    ThrottleModule,
    CommonModelModule,
    CommonClientModule,
    CommonAuthModule,
    CommonEvmModule,
    CommonLicenseModule,
    CommonNotificationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: BaseErrorFilter,
    },
  ],
  exports: [
    ThrottleModule,
    CommonModelModule,
    CommonClientModule,
    CommonAuthModule,
    CommonEvmModule,
    CommonLicenseModule,
    CommonNotificationModule,
  ],
})
export class CommonModule {}
