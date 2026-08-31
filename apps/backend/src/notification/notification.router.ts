import { Logger } from '@nestjs/common'
import { Router, Subscription, UseMiddlewares, Ctx, Options, Query, Input, Mutation } from 'nestjs-trpc'
import { TRPCError } from '@trpc/server'

import { CommonNotificationService } from '../common/notification/notification.service.js'
import { AuthMiddleware } from '../common/auth/auth.middleware.js'
import type { TAppContextWithTokenPayload } from '../common/auth/auth.types.js'

import {
  findNotificationsInputSchema,
  type TFindNotificationsInput,
  findNotificationsOutputSchema,
  type TFindNotificationsOutput,
  markNotificationAsReadInputSchema,
  type TMarkNotificationAsReadInput,
  markNotificationAsReadOutputSchema,
  type TMarkNotificationAsReadOutput,
  markAllMyNotificationsAsReadOutputSchema,
  type TMarkAllMyNotificationsAsReadOutput,
} from './notification.dto.js'

@Router({ alias: 'notifications' })
export class NotificationRouter {
  private readonly logger = new Logger(this.constructor.name)

  constructor(private readonly commonNotificationService: CommonNotificationService) {}

  @UseMiddlewares(AuthMiddleware)
  @Subscription()
  async *onMessage(@Ctx() ctx: TAppContextWithTokenPayload, @Options() opts: { signal?: AbortSignal }) {
    const eventName = this.commonNotificationService.getSubNotificationEventName(ctx.authTokenPayload.sub)
    const iterable = this.commonNotificationService.listen(eventName, opts?.signal)
    for await (const event of iterable) {
      yield event
    }
  }

  @UseMiddlewares(AuthMiddleware)
  @Query({
    input: findNotificationsInputSchema,
    output: findNotificationsOutputSchema,
  })
  async findMyNotifications(
    @Input() input: TFindNotificationsInput,
    @Ctx() ctx: TAppContextWithTokenPayload,
  ): Promise<TFindNotificationsOutput> {
    const paginationOptions = this.commonNotificationService.buildPaginationOptions({
      ...input,
      sub: ctx.authTokenPayload.sub,
    })
    const result = await this.commonNotificationService.paginate(paginationOptions)
    const totalCount = await this.commonNotificationService.count({
      sub: ctx.authTokenPayload.sub,
    })
    return { ...result, totalCount }
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: markNotificationAsReadInputSchema,
    output: markNotificationAsReadOutputSchema,
  })
  async markMyNotificationAsRead(
    @Input() input: TMarkNotificationAsReadInput,
    @Ctx() ctx: TAppContextWithTokenPayload,
  ): Promise<TMarkNotificationAsReadOutput> {
    const notification = await this.commonNotificationService.findOne({
      _id: input.id,
      sub: ctx.authTokenPayload.sub,
    })
    if (!notification) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `Notification not found` })
    }
    notification.readAt = new Date()
    await notification.save()
    return notification.toJSON()
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    output: markAllMyNotificationsAsReadOutputSchema,
  })
  async markAllMyNotificationsAsRead(
    @Ctx() ctx: TAppContextWithTokenPayload,
  ): Promise<TMarkAllMyNotificationsAsReadOutput> {
    await this.commonNotificationService.getModel().updateMany(
      {
        sub: ctx.authTokenPayload.sub,
        readAt: null,
      },
      {
        $set: {
          readAt: new Date(),
        },
      },
    )
    return { ok: true }
  }
}
