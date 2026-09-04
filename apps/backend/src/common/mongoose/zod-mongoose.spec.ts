import { model } from 'mongoose'
import { describe, expect, it, vi } from 'vitest'

import { CashoutSchema, CashoutStatus } from '#backend/cashout/cashout.schema.js'
import { BlockedLicenseSchema } from '#backend/common/license/blocked-license/blocked-license.schema.js'
import {
  CommonNotificationSchema,
  CommonNotificationSchemaDefinition,
} from '#backend/common/notification/notification.schema.js'
import { ContentFileSchema } from '#backend/content/file/file.schema.js'
import { PurchaseHistoryItemSchema } from '#backend/content/purchase-history/purchase-history-item.schema.js'
import { ContentSchema, ContentSchemaDefinition, ContentStatus } from '#backend/content/content.schema.js'
import { EvmEventSchema, EvmEventSchemaDefinition } from '#backend/evm-listener/evm-event.schema.js'
import { EvmSyncStateSchema } from '#backend/evm-listener/evm-sync-state.schema.js'
import { PublisherSchema } from '#backend/publisher/publisher.schema.js'

describe('Zod-generated Mongoose schemas', () => {
  it.each([
    [ContentSchema, 'contents'],
    [ContentFileSchema, 'content_files'],
    [PurchaseHistoryItemSchema, 'purchase_history_items'],
    [CashoutSchema, 'cashouts'],
    [PublisherSchema, 'publishers'],
    [EvmEventSchema, 'evm_events'],
    [EvmSyncStateSchema, 'evm_sync_state'],
    [CommonNotificationSchema, 'notifications'],
    [BlockedLicenseSchema, 'blocked_licenses'],
  ])('keeps the %s collection name', (schema, collection) => {
    expect(schema.get('collection')).toBe(collection)
  })

  it('keeps content transforms, defaults, optional fields, and indexes', () => {
    expect(ContentSchema.path('contractAddress').options).toMatchObject({
      required: true,
      lowercase: true,
      trim: true,
    })
    expect(ContentSchema.path('tokenId').options.required).toBe(false)
    expect(ContentSchema.path('metadata').instance).toBe('Mixed')
    expect(ContentSchema.path('tags').isRequired).toBe(false)
    expect(ContentSchema.path('status').options).toMatchObject({
      required: true,
      default: ContentStatus.ACTIVE,
      enum: Object.values(ContentStatus),
    })
    expect(ContentSchema.indexes()).toContainEqual([
      { contractAddress: 1, tokenId: 1 },
      {
        unique: true,
        name: 'contractAddress_tokenId_unique_partial',
        partialFilterExpression: { tokenId: { $exists: true, $ne: null, $type: 'string' } },
      },
    ])
    expect(ContentSchema.indexes()).toContainEqual([{ 'metadata.$**': 1 }, {}])
  })

  it('keeps ObjectId references and optional purchase fields', () => {
    expect(ContentFileSchema.path('contentId').instance).toBe('ObjectId')
    expect(ContentFileSchema.path('contentId').options).toMatchObject({ required: true, ref: 'Content' })
    expect(PurchaseHistoryItemSchema.path('contentId').instance).toBe('ObjectId')
    expect(PurchaseHistoryItemSchema.path('contentId').options.ref).toBe('Content')
    expect(PurchaseHistoryItemSchema.path('buyerAddress').options).toMatchObject({
      required: true,
      lowercase: true,
      trim: true,
    })
    expect(PurchaseHistoryItemSchema.path('priceFiat').options.required).toBe(false)
    expect(PurchaseHistoryItemSchema.path('metadata').instance).toBe('Mixed')
  })

  it('keeps cashout constraints and defaults', () => {
    expect(CashoutSchema.path('amount').options).toMatchObject({ required: true, min: 1 })
    expect(CashoutSchema.path('status').options).toMatchObject({
      required: true,
      default: CashoutStatus.PENDING,
    })
    expect(CashoutSchema.path('reason').options.required).toBe(false)
  })

  it('keeps the publisher balance as an id-less required subdocument', () => {
    const balancePath = PublisherSchema.path('fiatBalance')
    const balanceSchema = balancePath.schema
    if (!balanceSchema) throw new Error('fiatBalance must remain a subdocument')
    expect(balancePath.options).toMatchObject({
      required: true,
      default: { available: 0, pending: 0 },
    })
    expect(balanceSchema.options._id).toBe(false)
    expect(balanceSchema.path('available').options).toMatchObject({ required: true, default: 0, min: 0 })
    expect(PublisherSchema.indexes()).toContainEqual([{ sub: 1 }, { unique: true }])
  })

  it('keeps event path and compound indexes', () => {
    for (const path of ['contractAddress', 'eventName', 'blockNumber', 'transactionHash', 'logIndex']) {
      expect(EvmEventSchema.indexes()).toContainEqual([{ [path]: 1 }, {}])
    }
    expect(EvmEventSchema.path('args').instance).toBe('Mixed')
    expect(EvmEventSchema.path('raw').options.required).toBe(true)
    expect(EvmEventSchema.indexes()).toContainEqual([{ transactionHash: 1, logIndex: 1 }, { unique: true }])
    expect(EvmSyncStateSchema.indexes()).toContainEqual([{ name: 1 }, { unique: true }])
  })

  it('keeps notification defaults and TTL behavior', () => {
    expect(CommonNotificationSchema.path('payload').instance).toBe('Mixed')
    expect(CommonNotificationSchema.path('readAt').options).toMatchObject({ required: false, default: null })
    expect(CommonNotificationSchema.indexes()).toContainEqual([{ expiresAt: 1 }, { expireAfterSeconds: 0 }])
  })

  it('calculates notification expiration relative to each document creation time', () => {
    const dayInMilliseconds = 24 * 60 * 60 * 1000
    const firstCreationTime = new Date('2026-01-01T00:00:00.000Z')
    const secondCreationTime = new Date('2026-02-01T00:00:00.000Z')
    const NotificationModel = model('NotificationExpiryDefault', CommonNotificationSchema)

    vi.useFakeTimers()
    try {
      vi.setSystemTime(firstCreationTime)
      const firstDefinition = CommonNotificationSchemaDefinition.parse({ type: 'OTHER', sub: 'first', payload: {} })
      const firstDocument = new NotificationModel({ type: 'OTHER', sub: 'first' })

      vi.setSystemTime(secondCreationTime)
      const secondDefinition = CommonNotificationSchemaDefinition.parse({ type: 'OTHER', sub: 'second', payload: {} })
      const secondDocument = new NotificationModel({ type: 'OTHER', sub: 'second' })

      expect(firstDefinition.expiresAt.getTime()).toBe(firstCreationTime.getTime() + 90 * dayInMilliseconds)
      expect(firstDocument.expiresAt.getTime()).toBe(firstCreationTime.getTime() + 90 * dayInMilliseconds)
      expect(secondDefinition.expiresAt.getTime()).toBe(secondCreationTime.getTime() + 90 * dayInMilliseconds)
      expect(secondDocument.expiresAt.getTime()).toBe(secondCreationTime.getTime() + 90 * dayInMilliseconds)
    } finally {
      vi.useRealTimers()
    }
  })

  it('applies generated Mongoose transforms and defaults', async () => {
    const ContentModel = model('ContentSchemaParity', ContentSchema)
    const document = new ContentModel({ sub: 'owner', contractAddress: ' 0xABC ' })

    expect(document.contractAddress).toBe('0xabc')
    expect(document.metadata).toEqual({})
    expect(document.tags).toEqual([])
    expect(document.status).toBe(ContentStatus.ACTIVE)
    await expect(document.validate()).resolves.toBeUndefined()
  })

  it('uses the same definitions for Zod parsing', () => {
    expect(ContentSchemaDefinition.parse({ sub: 'owner', contractAddress: ' 0xABC ' })).toEqual({
      sub: 'owner',
      contractAddress: '0xabc',
      metadata: {},
      tags: [],
      status: ContentStatus.ACTIVE,
    })
    expect(
      EvmEventSchemaDefinition.safeParse({
        contractAddress: '0xabc',
        eventName: 'Transfer',
        blockNumber: 1,
        transactionHash: '0x123',
        logIndex: 0,
      }).success,
    ).toBe(false)
  })
})
