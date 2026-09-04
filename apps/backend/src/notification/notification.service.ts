import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { mongo } from 'mongoose'

import { NOTIFICATION_TYPE } from '@repo/notifications'

import { EvmEventService } from '#backend/evm-listener/evm-event.service.js'
import type { EvmEvent } from '#backend/evm-listener/evm-event.schema.js'
import { ContentModelService } from '#backend/content/content-model.service.js'
import { ContentService } from '#backend/content/content.service.js'
import { PurchaseHistoryService } from '#backend/content/purchase-history/purchase-history.service.js'
import { PublisherService } from '#backend/publisher/publisher.service.js'

import { CommonNotificationService } from '#backend/common/notification/notification.service.js'
import { CommonEvmService } from '#backend/common/evm/evm.service.js'

@Injectable()
export class NotificationService implements OnModuleInit {
  private logger = new Logger(this.constructor.name)
  private evmEventsChangeStream!: mongo.ChangeStream<EvmEvent>
  private evmEventsChangeStreamResumeToken: mongo.ResumeToken = undefined

  constructor(
    private readonly contentService: ContentService,
    private readonly contentModelService: ContentModelService,
    private readonly evmEventService: EvmEventService,
    private readonly commonEvmService: CommonEvmService,
    private readonly commonNotificationService: CommonNotificationService,
    private readonly purchaseHistoryService: PurchaseHistoryService,
    private readonly publisherService: PublisherService,
  ) {}

  private async restartEvmEventsChangeStream() {
    if (this.evmEventsChangeStream) {
      try {
        this.evmEventsChangeStream.removeAllListeners()
        await this.evmEventsChangeStream.close()
      } catch {
        this.logger.error('Failed to close change stream')
      }
    }

    setTimeout(() => {
      this.logger.log('Restarting change stream...')
      this.startEvmEventsChangeStream()
    }, 2000)
  }

  startEvmEventsChangeStream() {
    this.evmEventsChangeStream = this.evmEventService.getModel().watch([{ $match: { operationType: 'insert' } }], {
      resumeAfter: this.evmEventsChangeStreamResumeToken,
    })
    this.evmEventsChangeStream.on('change', (change: mongo.ChangeStreamDocument<EvmEvent>) => {
      this.evmEventsChangeStreamResumeToken = change._id
      if (change.operationType !== 'insert') return
      void (async () => {
        try {
          const eventName = change.fullDocument.eventName
          const contentNftContractAddress = await this.contentService.getContentNftContractAddress()
          const args = change.fullDocument.args as string[]
          switch (eventName) {
            case 'LicenseBought': {
              const tokenId = args[1]
              const toAddress = args[0]?.toLowerCase()
              const toSub = await this.commonEvmService.getSubByEvmAddress(toAddress)

              const content = await this.contentModelService.getModel().findOne({
                contractAddress: contentNftContractAddress,
                tokenId,
              })

              if (!content) {
                this.logger.warn(`Cannot find content for contract: ${change.fullDocument.contractAddress}`)
                return
              }

              const notification = {
                payload: {
                  tx: {
                    ...change.fullDocument,
                    _id: String(change.fullDocument._id),
                  },
                  content: {
                    metadata: content.metadata,
                    _id: content.id,
                  },
                },
              }

              const priceFiat = toCents(args[3])
              const platformFeeAmount = String(args[7] ?? '0')
              const agencyFeeAmount = String(args[8] ?? '0')
              const fiatCredit = priceFiat - toCents(platformFeeAmount) - toCents(agencyFeeAmount)

              await Promise.all([
                this.commonNotificationService
                  .getModel()
                  .insertMany([
                    { ...notification, sub: toSub, type: NOTIFICATION_TYPE.LICENSE_PURCHASED },
                    ...(content.sub !== toSub
                      ? [{ ...notification, sub: content.sub, type: NOTIFICATION_TYPE.LICENSE_SOLD }]
                      : []),
                  ]),
                this.purchaseHistoryService.create({
                  buyerAddress: toAddress,
                  contentId: content.id,
                  metadata: content.metadata,
                  licenseType: Number(args[2]),
                  txHash: change.fullDocument.transactionHash,
                  priceFiat: String(args[3] ?? '0'),
                  priceEther: String(args[4] ?? '0'),
                  priceToken: String(args[5] ?? '0'),
                  currencyTokenContract: String(args[6] ?? '').toLowerCase(),
                  platformFeeAmount,
                  agencyFeeAmount,
                  ownerId: content.sub,
                }),
                ...(fiatCredit > 0
                  ? [
                      this.publisherService.incrementFiatAvailable(content.sub, fiatCredit).then((publisher) => {
                        if (!publisher) {
                          this.logger.warn(`Cannot credit fiat balance; publisher not found for sub: ${content.sub}`)
                        }
                      }),
                    ]
                  : []),
              ])
              break
            }
            case 'Transfer': {
              // PASS for now we'll trigger this later
              // Currently not used but might be useful in the future
              break
            }
            default: {
              this.logger.warn(`Unhandled event: ${change.fullDocument.eventName}`)
              return
            }
          }
        } catch (err) {
          this.logger.error(err)
        }
      })()
    })
    this.evmEventsChangeStream.on('error', (err) => {
      this.logger.error('Change stream error:', err)
      void this.restartEvmEventsChangeStream()
    })
    this.evmEventsChangeStream.on('close', () => {
      this.logger.warn('Change stream closed')
      void this.restartEvmEventsChangeStream()
    })
    this.logger.log('Change stream started')
  }

  onModuleInit() {
    this.startEvmEventsChangeStream()
  }
}

function toCents(value: unknown): number {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }
  return Math.trunc(amount)
}
