import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { EventEmitter, on } from 'events'
import { mongo, Model } from 'mongoose'

import type { TNotification } from '@repo/notifications'

import { CommonModelService } from '../model/model.service.js'
import type { TBuiltPaginationOptions } from '../model/model.dto.js'

import { CommonNotification } from './notification.schema.js'
import type { TFindCommonNotificationsInput } from './notification.dto.js'

@Injectable()
export class CommonNotificationService extends CommonModelService<CommonNotification> implements OnModuleInit {
  private logger = new Logger(this.constructor.name)
  private readonly ee = new EventEmitter()
  private changeStream!: mongo.ChangeStream<CommonNotification>
  private changeStreamResumeToken: mongo.ResumeToken = undefined

  constructor(@InjectModel(CommonNotification.name) private commonNotificationModel: Model<CommonNotification>) {
    super(commonNotificationModel)
  }

  emit(eventName: string, data: TNotification) {
    this.ee.emit(eventName, data)
  }

  getSubNotificationEventName(sub: string) {
    return `notifications#${sub}`
  }

  emitSubNotification(sub: string, data: TNotification) {
    const eventName = this.getSubNotificationEventName(sub)
    this.emit(eventName, data)
  }

  async *listen(eventName: string, signal?: AbortSignal) {
    // 'on' turns the event emitter into an async iterator
    // Passing the 'signal' ensures the listener is destroyed if the client disconnects
    for await (const [event] of on(this.ee, eventName, { signal })) {
      yield event
    }
  }

  async count(query: Record<string, unknown>): Promise<number> {
    return await this.commonNotificationModel.countDocuments(query)
  }

  buildPaginationOptions(opts: TFindCommonNotificationsInput): TBuiltPaginationOptions {
    const result = super.buildPaginationOptions(opts)
    Object.assign(result.query, {
      ...(opts.sub && { sub: opts.sub }),
      ...(opts.type && { type: opts.type }),
      ...(opts.isRead !== undefined && { readAt: { $ne: null, $exists: true } }),
      ...(opts.isUnread !== undefined && { readAt: null }),
    })
    return result
  }

  private async restartChangeStream() {
    if (this.changeStream) {
      try {
        this.changeStream.removeAllListeners()
        await this.changeStream.close()
      } catch {
        this.logger.error('Failed to close change stream')
      }
    }

    setTimeout(() => {
      this.logger.log('Restarting change stream...')
      this.startChangeStream()
    }, 2000)
  }

  private startChangeStream() {
    this.changeStream = this.getModel().watch([{ $match: { operationType: 'insert' } }], {
      resumeAfter: this.changeStreamResumeToken,
    })
    this.changeStream.on('change', (change: mongo.ChangeStreamDocument<CommonNotification>) => {
      this.changeStreamResumeToken = change._id
      if (change.operationType !== 'insert') return
      void this.emitSubNotification(change.fullDocument.sub, change.fullDocument)
    })
    this.changeStream.on('error', (err) => {
      this.logger.error('Change stream error:', err)
      void this.restartChangeStream()
    })
    this.changeStream.on('close', () => {
      this.logger.warn('Change stream closed')
      void this.restartChangeStream()
    })
    this.logger.log('Change stream started')
  }

  onModuleInit() {
    this.startChangeStream()
  }
}
