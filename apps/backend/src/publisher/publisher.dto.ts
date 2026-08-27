import { z } from 'zod'

import { paginatedRequestWithCursorSchema, createPaginatedResponseSchema } from '../common/model/model.dto'

export const publisherFiatBalanceSchema = z.object({
  available: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
})
export type TPublisherFiatBalance = z.infer<typeof publisherFiatBalanceSchema>

export const getMyBalanceOutputSchema = publisherFiatBalanceSchema
export type TGetMyBalanceOutput = z.infer<typeof getMyBalanceOutputSchema>

export const setPublisherInputSchema = z.object({
  title: z.string(),
  avatarUrl: z.string().optional(),
})
export type TSetPublisherInput = z.infer<typeof setPublisherInputSchema>

export const setPublisherOutputSchema = z.object({
  id: z.string(),
  sub: z.string(),
  title: z.string(),
  avatarUrl: z.string().optional(),
  fiatBalance: publisherFiatBalanceSchema.default({ available: 0, pending: 0 }),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type TSetPublisherOutput = z.infer<typeof setPublisherOutputSchema>

export const getPublisherDataInputSchema = z
  .object({
    sub: z.string().optional(),
    id: z.string().optional(),
  })
  .refine((data) => Boolean(data.id || data.sub), {
    message: 'Either `_id` or `sub` must be provided.',
    path: ['sub'],
  })
export type TGetPublisherDataInput = z.infer<typeof getPublisherDataInputSchema>

export const getPublisherDataOutputSchema = z.object({
  id: z.string(),
  sub: z.string(),
  title: z.string(),
  avatarUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  evmAddress: z.string().optional(),
})
export type TGetPublisherDataOutput = z.infer<typeof getPublisherDataOutputSchema>

export const findPublishersInputSchema = paginatedRequestWithCursorSchema.extend({
  title: z.string().optional(),
  sub: z.string().optional(),
  addresses: z.array(z.string()).optional(),
})
export type TFindPublishersInput = z.infer<typeof findPublishersInputSchema>

export const publisherItemSchema = z.object({
  id: z.string(),
  sub: z.string(),
  title: z.string(),
  avatarUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const findPublishersOutputSchema = createPaginatedResponseSchema(publisherItemSchema)
export type TFindPublishersOutput = z.infer<typeof findPublishersOutputSchema>

export const mintContentNftTokenInputSchema = z.object({
  tokenUri: z.string().optional(),
  licenseType: z.union([z.literal(0), z.literal(2)]),
})
export type TMintContentNftTokenInput = z.infer<typeof mintContentNftTokenInputSchema>

export const contentNftVoucherSchema = z.object({
  nonce: z.string(),
  price: z.string(),
  priceToken: z.string(),
  licenseInfo: z.string(),
  uri: z.string(),
})

export const mintContentNftTokenOutputSchema = z.object({
  sig: z.string(),
  domain: z.object({
    name: z.string(),
    version: z.string(),
    chainId: z.number(),
    verifyingContract: z.string(),
  }),
  voucher: contentNftVoucherSchema,
})
export type TMintContentNftTokenOutput = z.infer<typeof mintContentNftTokenOutputSchema>
