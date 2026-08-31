process.env.NODE_ENV = process.env.NODE_ENV || 'local'

import { NestFactory } from '@nestjs/core'
import { ConsoleLogger, Logger } from '@nestjs/common'
import { json } from 'body-parser'
import { ConfigService } from '@nestjs/config'
import { WebSocketServer } from 'ws'
import { applyWSSHandler } from '@trpc/server/adapters/ws'
import { AppRouterHost } from 'nestjs-trpc'
import { randomUUID } from 'crypto'
import type { Server } from 'http'

import { AppModule } from './app.module.js'

async function bootstrap() {
  const env = process.env.NODE_ENV
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'CHAPTER_IP',
      json: env !== 'local',
    }),
  })
  app.use(json({ limit: '10mb' }))
  app.enableCors()

  const configService = app.get(ConfigService)
  const port = configService.get<number>('port')!

  // console.log(`Config:`, configService.get('cloudflare.rtwo'))

  await app.listen(port, () => {
    logger.log(`🚀 Running at "${port}" in "${env}" mode`)
  })

  // Set up WebSocket server for tRPC subscriptions
  const appRouterHost = app.get<InstanceType<typeof AppRouterHost>>(AppRouterHost)
  const httpServer = app.getHttpServer() as Server
  const wss = new WebSocketServer({
    server: httpServer,
    // Allow cross-origin WebSocket connections, matching the HTTP CORS policy
    verifyClient: () => true,
  })
  const wsLogger = new Logger('WebSocket')
  wss.on('connection', (ws, req) => {
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress)
    wsLogger.log(`Client connected from ${clientIp}`)
    ws.on('close', (code) => {
      wsLogger.log(`Client from ${clientIp} disconnected (code: ${code})`)
    })
  })

  applyWSSHandler({
    wss,
    router: appRouterHost.appRouter,
    prefix: '/trpc',
    createContext: ({ req, info }) => {
      const accessToken = info?.connectionParams?.Authorization
      return { accessToken, requestId: randomUUID(), req }
    },
  })
  logger.log(`🚀 WebSocket server for tRPC subscriptions ready`)
}
void bootstrap()
