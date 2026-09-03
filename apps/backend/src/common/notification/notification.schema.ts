import type { HydratedDocument } from 'mongoose'
import { DateTime } from 'luxon'

import { NOTIFICATION_TYPE_VALUES } from '@repo/notifications'

import { createMongooseSchema, withMongoose, z } from '../mongoose/zod-mongoose.js'

export const CommonNotificationSchemaDefinition = z.object({
  type: z.enum(NOTIFICATION_TYPE_VALUES),
  sub: z.string(),
  title: z.string().optional(),
  message: z.string().optional(),
  payload: withMongoose(z.custom<Record<string, unknown>>(), { type: 'Mixed', required: false }),
  readAt: withMongoose(z.date().nullable().default(null), { required: false }),
  expiresAt: withMongoose(z.date().default(DateTime.utc().plus({ days: 90 }).toJSDate()), { required: false }),
})
export type CommonNotification = z.infer<typeof CommonNotificationSchemaDefinition> & {
  id: string
  createdAt: Date
  updatedAt: Date
}
export type TCommonNotificationDocument = HydratedDocument<CommonNotification>
export const CommonNotificationModelName = 'CommonNotification'
export const CommonNotificationSchema = createMongooseSchema(CommonNotificationSchemaDefinition, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'notifications',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
CommonNotificationSchema.index({ sub: 1 })
CommonNotificationSchema.index({ type: 1 })
CommonNotificationSchema.index({ readAt: 1 })
CommonNotificationSchema.index({ createdAt: 1 })
CommonNotificationSchema.index({ updatedAt: 1 })
CommonNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
