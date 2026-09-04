import { Router, Mutation, Query, Input, Ctx, UseMiddlewares } from 'nestjs-trpc'

import { AuthMiddleware, AdminAuthMiddleware } from '../common/auth/auth.middleware.js'
import type { TAppContextWithTokenPayload } from '../common/auth/auth.types.js'

import { CashoutService } from './cashout.service.js'
import {
  cancelCashoutInputSchema,
  cancelCashoutOutputSchema,
  createCashoutInputSchema,
  createCashoutOutputSchema,
  findCashoutsInputSchema,
  findCashoutsOutputSchema,
  getMyCashoutsInputSchema,
  getMyCashoutsOutputSchema,
  updateCashoutStatusInputSchema,
  updateCashoutStatusOutputSchema,
  type TCancelCashoutInput,
  type TCancelCashoutOutput,
  type TCreateCashoutInput,
  type TCreateCashoutOutput,
  type TFindCashoutsInput,
  type TFindCashoutsOutput,
  type TGetMyCashoutsInput,
  type TGetMyCashoutsOutput,
  type TUpdateCashoutStatusInput,
  type TUpdateCashoutStatusOutput,
} from './cashout.dto.js'

@Router({ alias: 'cashouts' })
export class CashoutRouter {
  constructor(private readonly cashoutService: CashoutService) {}

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: createCashoutInputSchema,
    output: createCashoutOutputSchema,
  })
  async createCashout(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TCreateCashoutInput,
  ): Promise<TCreateCashoutOutput> {
    const cashout = await this.cashoutService.createCashout(ctx.authTokenPayload.sub, input)
    return cashout.toJSON()
  }

  @UseMiddlewares(AuthMiddleware)
  @Query({
    input: getMyCashoutsInputSchema,
    output: getMyCashoutsOutputSchema,
  })
  async getMyCashouts(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TGetMyCashoutsInput,
  ): Promise<TGetMyCashoutsOutput> {
    const sub = ctx.authTokenPayload.sub
    const paginationOptions = this.cashoutService.buildPaginationOptions({
      ...input,
      sub,
    })
    const result = await this.cashoutService.paginate(paginationOptions)
    const totalCount = await this.cashoutService.count({
      sub,
      ...(input.status && { status: input.status }),
    })
    return { ...result, totalCount }
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: cancelCashoutInputSchema,
    output: cancelCashoutOutputSchema,
  })
  async cancelCashout(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TCancelCashoutInput,
  ): Promise<TCancelCashoutOutput> {
    const cashout = await this.cashoutService.cancelCashout(ctx.authTokenPayload.sub, input)
    return cashout.toJSON()
  }

  @UseMiddlewares(AuthMiddleware, AdminAuthMiddleware)
  @Query({
    input: findCashoutsInputSchema,
    output: findCashoutsOutputSchema,
  })
  async findCashouts(@Input() input: TFindCashoutsInput): Promise<TFindCashoutsOutput> {
    const paginationOptions = this.cashoutService.buildPaginationOptions(input)
    const result = await this.cashoutService.paginate(paginationOptions)
    const totalCount = await this.cashoutService.count({
      ...(input.sub && { sub: input.sub }),
      ...(input.status && { status: input.status }),
    })
    return { ...result, totalCount }
  }

  @UseMiddlewares(AuthMiddleware, AdminAuthMiddleware)
  @Mutation({
    input: updateCashoutStatusInputSchema,
    output: updateCashoutStatusOutputSchema,
  })
  async updateCashoutStatus(@Input() input: TUpdateCashoutStatusInput): Promise<TUpdateCashoutStatusOutput> {
    const cashout = await this.cashoutService.updateCashoutStatus(input)
    return cashout.toJSON()
  }
}
