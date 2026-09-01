import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'

import { CommonModelService } from '../common/model/model.service.js'

import { Content } from './content.schema.js'
import type { TBuiltPaginationOptions } from '../common/model/model.dto.js'
import { TFindContentInput, TFilterNode, TFilterCondition } from './content.dto.js'

const METADATA_FIELD_PREFIX = 'metadata.'

@Injectable()
export class ContentModelService extends CommonModelService<Content> {
  constructor(@InjectModel(Content.name) private contentModel: Model<Content>) {
    super(contentModel)
  }

  buildPaginationOptions(opts: TFindContentInput): TBuiltPaginationOptions {
    const result = super.buildPaginationOptions(opts)
    const filterQuery = opts.metadata ? this.buildFilterQuery(opts.metadata) : {}

    result.query = {
      ...result.query,
      ...(opts.tokenId && { tokenId: opts.tokenId }),
      ...(opts.sub && { sub: opts.sub }),
      ...(opts.contractAddress && { contractAddress: opts.contractAddress }),
      ...(opts.status && { status: opts.status }),
      ...filterQuery,
    }
    return result
  }

  private buildFilterQuery(node: TFilterNode): Record<string, unknown> {
    if ('and' in node) {
      return { $and: node.and.map((child) => this.buildFilterQuery(child)) }
    }
    if ('or' in node) {
      return { $or: node.or.map((child) => this.buildFilterQuery(child)) }
    }
    return this.buildConditionQuery(node)
  }

  private buildConditionQuery(condition: TFilterCondition): Record<string, unknown> {
    const field = condition.field.startsWith(METADATA_FIELD_PREFIX)
      ? condition.field
      : `${METADATA_FIELD_PREFIX}${condition.field}`

    switch (condition.op) {
      case 'eq':
        return { [field]: { $eq: condition.val } }
      case 'ne':
        return { [field]: { $ne: condition.val } }
      case 'gt':
        return { [field]: { $gt: condition.val } }
      case 'gte':
        return { [field]: { $gte: condition.val } }
      case 'lt':
        return { [field]: { $lt: condition.val } }
      case 'lte':
        return { [field]: { $lte: condition.val } }
      case 'in':
        return { [field]: { $in: condition.val } }
      case 'nin':
        return { [field]: { $nin: condition.val } }
      case 'exists':
        return { [field]: { $exists: condition.val } }
      case 'regex':
        return { [field]: { $regex: condition.val } }
    }
  }

  async findSimilarByTags(contentId: string, tags: string[], limit = 20) {
    if (!tags.length) {
      return []
    }

    const results = await this.contentModel.aggregate([
      {
        $match: {
          _id: { $ne: new Types.ObjectId(contentId) },
          tags: { $in: tags },
        },
      },
      {
        $addFields: {
          matchingTagsCount: {
            $size: { $setIntersection: ['$tags', tags] },
          },
        },
      },
      { $match: { matchingTagsCount: { $gt: 0 } } },
      { $sort: { matchingTagsCount: -1, createdAt: -1 } },
      { $limit: limit },
      { $project: { matchingTagsCount: 0 } },
    ])

    return results.map((item) => ({ ...item, id: String(item._id) }))
  }
}
