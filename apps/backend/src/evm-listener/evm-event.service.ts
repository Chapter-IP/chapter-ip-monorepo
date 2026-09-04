import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { CommonModelService } from '#backend/common/model/model.service.js'

import { EvmEventModelName, type EvmEvent } from './evm-event.schema.js'

@Injectable()
export class EvmEventService extends CommonModelService<EvmEvent> {
  constructor(@InjectModel(EvmEventModelName) private evmEventModel: Model<EvmEvent>) {
    super(evmEventModel)
  }
}
