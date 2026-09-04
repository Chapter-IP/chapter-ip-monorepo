import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { CommonModelService } from '#backend/common/model/model.service.js'
import type { TBuiltPaginationOptions } from '#backend/common/model/model.dto.js'

import { PublisherModelName, type Publisher } from './publisher.schema.js'
import type { TFindPublishersInput } from './publisher.dto.js'

@Injectable()
export class PublisherService extends CommonModelService<Publisher> {
  constructor(@InjectModel(PublisherModelName) private publisherModel: Model<Publisher>) {
    super(publisherModel)
  }

  buildPaginationOptions(opts: TFindPublishersInput): TBuiltPaginationOptions {
    const result = super.buildPaginationOptions(opts)
    result.query = {
      ...result.query,
      ...(opts.title && { title: { $regex: opts.title, $options: 'i' } }),
      ...(opts.sub && { sub: opts.sub }),
      ...(opts.addresses?.length && {
        evmAddress: { $in: opts.addresses.map((a) => a.toLowerCase()) },
      }),
    }
    return result
  }

  async getFiatBalance(sub: string): Promise<{ available: number; pending: number }> {
    const publisher = await this.publisherModel.findOne({ sub })
    return {
      available: publisher?.fiatBalance?.available ?? 0,
      pending: publisher?.fiatBalance?.pending ?? 0,
    }
  }

  async incrementFiatAvailable(sub: string, amount: number): Promise<Publisher | null> {
    return await this.publisherModel.findOneAndUpdate(
      { sub },
      { $inc: { 'fiatBalance.available': amount } },
      { returnDocument: 'after' },
    )
  }

  async lockFiatAvailable(sub: string, amount: number): Promise<Publisher | null> {
    return await this.publisherModel.findOneAndUpdate(
      { sub, 'fiatBalance.available': { $gte: amount } } as Record<string, unknown>,
      { $inc: { 'fiatBalance.available': -amount, 'fiatBalance.pending': amount } },
      { returnDocument: 'after' },
    )
  }

  async unlockFiatPending(sub: string, amount: number): Promise<Publisher | null> {
    return await this.publisherModel.findOneAndUpdate(
      { sub, 'fiatBalance.pending': { $gte: amount } } as Record<string, unknown>,
      { $inc: { 'fiatBalance.available': amount, 'fiatBalance.pending': -amount } },
      { returnDocument: 'after' },
    )
  }

  async settleFiatPending(sub: string, amount: number): Promise<Publisher | null> {
    return await this.publisherModel.findOneAndUpdate(
      { sub, 'fiatBalance.pending': { $gte: amount } } as Record<string, unknown>,
      { $inc: { 'fiatBalance.pending': -amount } },
      { returnDocument: 'after' },
    )
  }
}
