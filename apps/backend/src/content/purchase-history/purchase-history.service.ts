import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { CommonModelService } from '../../common/model/model.service.js'
import type { TBuiltPaginationOptions } from '../../common/model/model.dto.js'
import type { TFindPurchaseHistoryInput } from '../content.dto.js'

import { PurchaseHistoryItemModelName, type PurchaseHistoryItem } from './purchase-history-item.schema.js'

@Injectable()
export class PurchaseHistoryService extends CommonModelService<PurchaseHistoryItem> {
  constructor(@InjectModel(PurchaseHistoryItemModelName) private purchaseHistoryItemModel: Model<PurchaseHistoryItem>) {
    super(purchaseHistoryItemModel)
  }

  buildPaginationOptions(opts: TFindPurchaseHistoryInput & { ownerId: string }): TBuiltPaginationOptions {
    const result = super.buildPaginationOptions(opts)
    result.query = {
      ...result.query,
      ownerId: opts.ownerId,
      ...(opts.contentId && { contentId: opts.contentId }),
    }
    return result
  }

  async count(query: Record<string, unknown>): Promise<number> {
    return await this.purchaseHistoryItemModel.countDocuments(query)
  }
}
