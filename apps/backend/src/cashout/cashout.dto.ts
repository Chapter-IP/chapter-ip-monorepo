import { z } from 'zod'

import { paginatedRequestWithCursorSchema, createPaginatedResponseSchema } from '../common/model/model.dto.js'

import { CashoutPlatform, CashoutStatus } from './cashout.schema.js'

export const cashoutSchema = z.object({
  id: z.string(),
  sub: z.string(),
  amount: z.number().int().positive(),
  username: z.string(),
  platform: z.enum(CashoutPlatform),
  status: z.enum(CashoutStatus),
  reason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type TCashout = z.infer<typeof cashoutSchema>

export const createCashoutInputSchema = z.object({
  amount: z.number().int().positive(),
  username: z.string().trim().min(1).max(128),
  platform: z.enum(CashoutPlatform),
})
export type TCreateCashoutInput = z.infer<typeof createCashoutInputSchema>

export const createCashoutOutputSchema = cashoutSchema
export type TCreateCashoutOutput = z.infer<typeof createCashoutOutputSchema>

export const getMyCashoutsInputSchema = paginatedRequestWithCursorSchema.extend({
  status: z.enum(CashoutStatus).optional(),
})
export type TGetMyCashoutsInput = z.infer<typeof getMyCashoutsInputSchema>

export const getMyCashoutsOutputSchema = createPaginatedResponseSchema(cashoutSchema).extend({
  totalCount: z.number().int().nonnegative(),
})
export type TGetMyCashoutsOutput = z.infer<typeof getMyCashoutsOutputSchema>

export const cancelCashoutInputSchema = z.object({
  id: z.string(),
  reason: z.string().trim().max(500).optional(),
})
export type TCancelCashoutInput = z.infer<typeof cancelCashoutInputSchema>

export const cancelCashoutOutputSchema = cashoutSchema
export type TCancelCashoutOutput = z.infer<typeof cancelCashoutOutputSchema>

export const findCashoutsInputSchema = paginatedRequestWithCursorSchema.extend({
  status: z.enum(CashoutStatus).optional(),
  sub: z.string().optional(),
})
export type TFindCashoutsInput = z.infer<typeof findCashoutsInputSchema>

export const findCashoutsOutputSchema = createPaginatedResponseSchema(cashoutSchema).extend({
  totalCount: z.number().int().nonnegative(),
})
export type TFindCashoutsOutput = z.infer<typeof findCashoutsOutputSchema>

export const updateCashoutStatusInputSchema = z.object({
  id: z.string(),
  status: z.enum([CashoutStatus.PAID, CashoutStatus.REJECTED]),
  reason: z.string().trim().max(500).optional(),
})
export type TUpdateCashoutStatusInput = z.infer<typeof updateCashoutStatusInputSchema>

export const updateCashoutStatusOutputSchema = cashoutSchema
export type TUpdateCashoutStatusOutput = z.infer<typeof updateCashoutStatusOutputSchema>
