import { z } from 'zod'

import { paginatedRequestWithCursorSchema, createPaginatedResponseSchema } from '../../model/model.dto.js'

export const findBlockedLicensesInputSchema = paginatedRequestWithCursorSchema.extend({
  tokenId: z.string().optional(),
  subEvmAddress: z.string().optional(),
  sub: z.string().optional(),
})
export type TFindBlockedLicensesInput = z.infer<typeof findBlockedLicensesInputSchema>

export const blockedLicenseSchema = z.object({
  id: z.string(),
  tokenId: z.string(),
  subEvmAddress: z.string(),
  sub: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const findBlockedLicensesOutputSchema = createPaginatedResponseSchema(blockedLicenseSchema)
export type TFindBlockedLicensesOutput = z.infer<typeof findBlockedLicensesOutputSchema>
