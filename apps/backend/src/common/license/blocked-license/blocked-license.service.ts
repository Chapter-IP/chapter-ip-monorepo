import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { CommonModelService } from '../../model/model.service.js'
import type { TBuiltPaginationOptions } from '../../model/model.dto.js'

import { BlockedLicenseModelName, type BlockedLicense } from './blocked-license.schema.js'
import { TFindBlockedLicensesInput } from './blocked-license.dto.js'

@Injectable()
export class BlockedLicenseService extends CommonModelService<BlockedLicense> {
  constructor(@InjectModel(BlockedLicenseModelName) private blockedLicenseModel: Model<BlockedLicense>) {
    super(blockedLicenseModel)
  }

  buildPaginationOptions(opts: TFindBlockedLicensesInput): TBuiltPaginationOptions {
    const result = super.buildPaginationOptions(opts)
    result.query = {
      ...result.query,
      ...(opts.sub && { sub: opts.sub }),
      ...(opts.subEvmAddress && { subEvmAddress: opts.subEvmAddress.toLowerCase() }),
      ...(opts.tokenId && { tokenId: opts.tokenId }),
    }
    return result
  }
}
