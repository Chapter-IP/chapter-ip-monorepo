import { Module, Logger } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { TRPCModule } from 'nestjs-trpc'
import { merge } from 'es-toolkit'

import { CommonModule } from './common/common.module.js'
import { AuthModule } from './auth/auth.module.js'
import { ContentModule } from './content/content.module.js'
import { PublisherModule } from './publisher/publisher.module.js'
import { LicenseModule } from './license/license.module.js'
import { EvmListenerModule } from './evm-listener/evm-listener.module.js'
import { NotificationModule } from './notification/notification.module.js'
import { CashoutModule } from './cashout/cashout.module.js'

import { TrpcPanelController } from './trpc-ui.controller.js'
import { AppRouter } from './app.router.js'
import { AppContext } from './app.context.js'

import defaultConfig, { getEnv, ENV } from './app.config/default.js'
import stagingConfig from './app.config/staging.js'
import prodConfig from './app.config/prod.js'

const trpcErrorLogger = new Logger('TRPC Error')
const env: string = getEnv()
const environmentConfig = env === ENV.STAGING ? stagingConfig : env === ENV.PROD ? prodConfig : undefined

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => merge(defaultConfig(), environmentConfig?.() ?? {})],
    }),
    CommonModule,
    MongooseModule.forRootAsync({
      imports: [],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo.uri'),
        heartbeatFrequencyMS: 5000,
        retryAttempts: Number.MAX_VALUE,
        retryDelay: 2000,
        minPoolSize: 1,
      }),
      inject: [ConfigService],
    }),
    TRPCModule.forRoot({
      context: AppContext,
      // autoSchemaFile: process.env.NODE_ENV === 'local' ? '../../packages/trpc/src/server' : undefined,
      errorFormatter: ({ shape, error }) => {
        trpcErrorLogger.error(error)

        return shape
      },
    }),
    AuthModule,
    ContentModule,
    PublisherModule,
    LicenseModule,
    EvmListenerModule,
    NotificationModule,
    CashoutModule,
  ],
  controllers: [TrpcPanelController],
  providers: [AppContext, AppRouter],
})
export class AppModule {}
