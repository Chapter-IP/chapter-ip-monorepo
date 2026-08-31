import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { CommonModelService } from '../common/model/model.service.js'

import { EvmEvent } from './evm-event.schema.js'

@Injectable()
export class EvmEventService extends CommonModelService<EvmEvent> {
  constructor(@InjectModel(EvmEvent.name) private evmEventModel: Model<EvmEvent>) {
    super(evmEventModel)
  }
}
