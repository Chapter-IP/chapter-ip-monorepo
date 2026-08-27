import { Module, Logger } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { TRPCModule } from 'nestjs-trpc'
import merge from 'lodash/merge'

import { CommonModule } from './common/common.module'
import { AuthModule } from './auth/auth.module'
import { ContentModule } from './content/content.module'
import { PublisherModule } from './publisher/publisher.module'
import { LicenseModule } from './license/license.module'
import { EvmListenerModule } from './evm-listener/evm-listener.module'
import { NotificationModule } from './notification/notification.module'
import { CashoutModule } from './cashout/cashout.module'

import { TrpcPanelController } from './trpc-ui.controller'
import { AppRouter } from './app.router'
import { AppContext } from './app.context'

import defaultConfig, { getEnv, ENV } from './app.config/default'
import stagingConfig from './app.config/staging'
import prodConfig from './app.config/prod'

const trpcErrorLogger = new Logger('TRPC Error')
const env: string = getEnv()
const environmentConfig = env === ENV.STAGING ? stagingConfig : env === ENV.PROD ? prodConfig : undefined

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => merge({}, defaultConfig(), environmentConfig?.() ?? {})],
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
