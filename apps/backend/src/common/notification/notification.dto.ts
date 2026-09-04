import { z } from 'zod'

import { paginatedRequestWithCursorSchema } from '#backend/common/model/model.dto.js'

export const findCommonNotificationsInputSchema = paginatedRequestWithCursorSchema.extend({
  sub: z.string().optional(),
  type: z.string().optional(),
  isRead: z.boolean().optional(),
  isUnread: z.boolean().optional(),
})
export type TFindCommonNotificationsInput = z.infer<typeof findCommonNotificationsInputSchema>
