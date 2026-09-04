import { z } from 'zod'

import { notificationSchema, NOTIFICATION_TYPE_VALUES } from '@repo/notifications'

import { paginatedRequestWithCursorSchema, createPaginatedResponseSchema } from '#backend/common/model/model.dto.js'

export const findNotificationsInputSchema = paginatedRequestWithCursorSchema.extend({
  type: z.enum(NOTIFICATION_TYPE_VALUES).optional(),
  isRead: z.boolean().optional(),
  isUnread: z.boolean().optional(),
})
export type TFindNotificationsInput = z.infer<typeof findNotificationsInputSchema>

export const findNotificationsOutputSchema = createPaginatedResponseSchema(notificationSchema).extend({
  totalCount: z.number().int().nonnegative(),
})
export type TFindNotificationsOutput = z.infer<typeof findNotificationsOutputSchema>

export const markNotificationAsReadInputSchema = z.object({
  id: z.string(),
})
export type TMarkNotificationAsReadInput = z.infer<typeof markNotificationAsReadInputSchema>

export const markNotificationAsReadOutputSchema = notificationSchema
export type TMarkNotificationAsReadOutput = z.infer<typeof markNotificationAsReadOutputSchema>

export const markAllMyNotificationsAsReadOutputSchema = z.object({
  ok: z.boolean(),
})
export type TMarkAllMyNotificationsAsReadOutput = z.infer<typeof markAllMyNotificationsAsReadOutputSchema>
