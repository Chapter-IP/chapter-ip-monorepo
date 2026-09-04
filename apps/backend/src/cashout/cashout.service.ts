import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { TRPCError } from '@trpc/server'
import { Model } from 'mongoose'

import { CommonModelService } from '#backend/common/model/model.service.js'
import type { TBuiltPaginationOptions } from '#backend/common/model/model.dto.js'
import { PublisherService } from '#backend/publisher/publisher.service.js'

import { CashoutModelName, CashoutStatus, type Cashout, type TCashoutDocument } from './cashout.schema.js'
import type {
  TCancelCashoutInput,
  TCreateCashoutInput,
  TFindCashoutsInput,
  TUpdateCashoutStatusInput,
} from './cashout.dto.js'

@Injectable()
export class CashoutService extends CommonModelService<Cashout> {
  constructor(
    @InjectModel(CashoutModelName) private readonly cashoutModel: Model<Cashout>,
    private readonly publisherService: PublisherService,
  ) {
    super(cashoutModel)
  }

  buildPaginationOptions(opts: TFindCashoutsInput): TBuiltPaginationOptions {
    const result = super.buildPaginationOptions(opts)
    result.query = {
      ...result.query,
      ...(opts.sub && { sub: opts.sub }),
      ...(opts.status && { status: opts.status }),
    }
    return result
  }

  async count(query: Record<string, unknown>): Promise<number> {
    return await this.cashoutModel.countDocuments(query)
  }

  async createCashout(sub: string, input: TCreateCashoutInput): Promise<TCashoutDocument> {
    const publisher = await this.publisherService.findOne({ sub })
    if (!publisher) {
      throw new TRPCError({ message: 'Publisher not found', code: 'NOT_FOUND' })
    }

    const locked = await this.publisherService.lockFiatAvailable(sub, input.amount)
    if (!locked) {
      throw new TRPCError({ message: 'Insufficient available balance', code: 'BAD_REQUEST' })
    }

    try {
      const cashout = await this.cashoutModel.create({
        sub,
        amount: input.amount,
        username: input.username,
        platform: input.platform,
        status: CashoutStatus.PENDING,
      })
      if (!cashout) {
        throw new TRPCError({ message: 'Failed to create cashout', code: 'INTERNAL_SERVER_ERROR' })
      }
      return cashout
    } catch (err) {
      await this.publisherService.unlockFiatPending(sub, input.amount)
      throw err
    }
  }

  async cancelCashout(sub: string, input: TCancelCashoutInput): Promise<TCashoutDocument> {
    const cashout = await this.cashoutModel.findOneAndUpdate(
      { _id: input.id, sub, status: CashoutStatus.PENDING } as Record<string, unknown>,
      { $set: { status: CashoutStatus.CANCELLED, ...(input.reason ? { reason: input.reason } : {}) } },
      { returnDocument: 'after' },
    )

    if (!cashout) {
      throw new TRPCError({ message: 'Cashout not found', code: 'NOT_FOUND' })
    }

    const unlocked = await this.publisherService.unlockFiatPending(sub, cashout.amount)
    if (!unlocked) {
      throw new TRPCError({ message: 'Failed to unlock cashout balance', code: 'INTERNAL_SERVER_ERROR' })
    }

    return cashout
  }

  async updateCashoutStatus(input: TUpdateCashoutStatusInput): Promise<TCashoutDocument> {
    const cashout = await this.cashoutModel.findOneAndUpdate(
      { _id: input.id, status: CashoutStatus.PENDING } as Record<string, unknown>,
      {
        $set: {
          status: input.status,
          ...(input.reason ? { reason: input.reason } : {}),
        },
      },
      { returnDocument: 'after' },
    )

    if (!cashout) {
      const existing = await this.cashoutModel.findById(input.id)
      if (!existing) {
        throw new TRPCError({ message: 'Cashout not found', code: 'NOT_FOUND' })
      }
      throw new TRPCError({ message: 'Cashout is not pending', code: 'BAD_REQUEST' })
    }

    const updated =
      input.status === CashoutStatus.REJECTED
        ? await this.publisherService.unlockFiatPending(cashout.sub, cashout.amount)
        : await this.publisherService.settleFiatPending(cashout.sub, cashout.amount)

    if (!updated) {
      throw new TRPCError({ message: 'Failed to update cashout balance', code: 'INTERNAL_SERVER_ERROR' })
    }

    return cashout
  }
}
