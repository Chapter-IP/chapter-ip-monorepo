import type { Model, ProjectionType, QueryOptions, UpdateQuery } from 'mongoose'
import { BadRequestException } from '@nestjs/common'

import type { TPaginatedRequestWithCursor, TPaginatedResponseWithCursor, TBuiltPaginationOptions } from './model.dto'
import omit from 'lodash/omit'

export class CommonModelService<T> {
  constructor(protected model: Model<T>) {}

  getModel() {
    return this.model
  }

  async find(params?: Partial<T> | Record<string, unknown>, projection?: ProjectionType<T>, opts?: QueryOptions) {
    return await this.model.find(params as Record<string, unknown>, projection, opts)
  }

  async findOne(params?: Partial<T> | Record<string, unknown>, projection?: ProjectionType<T>, opts?: QueryOptions) {
    return await this.model.findOne(params as Record<string, unknown>, projection, opts)
  }

  async findById(id: string, projection?: ProjectionType<T>) {
    return await this.model.findById(id, projection)
  }

  async create(params: Partial<T>) {
    return await this.model.create(params)
  }

  async updateById(id: string, params: Partial<T> | UpdateQuery<T>) {
    return await this.model.findByIdAndUpdate(id, omit(params, ['_id']), { returnDocument: 'after' })
  }

  async deleteOne(params?: Partial<T> | Record<string, unknown>) {
    return await this.model.deleteOne(params as Record<string, unknown>)
  }

  async deleteMany(params?: Partial<T> | Record<string, unknown>) {
    return await this.model.deleteMany(params as Record<string, unknown>)
  }

  buildPaginationOptions(opts: TPaginatedRequestWithCursor): TBuiltPaginationOptions {
    const limit = opts.limit ? parseInt(opts.limit) : 50
    if (limit > 100) {
      throw new BadRequestException('Limit must be less than 100')
    }
    const sortBy = opts.sort || '_id'
    const sortOrder = opts.order === 'asc' ? 1 : -1
    const cursorDirection = opts.order === 'asc' ? '$gt' : '$lt'

    const query: TBuiltPaginationOptions['query'] = {
      ...(opts.cursor && { [sortBy]: { [cursorDirection]: Buffer.from(opts.cursor, 'hex').toString('utf8') } }),
      ...(opts.id && { _id: opts.id }),
      ...(opts.startCreatedAt && { createdAt: { $gte: opts.startCreatedAt } }),
      ...(opts.endCreatedAt && { createdAt: { $lte: opts.endCreatedAt } }),
      ...(opts.startUpdatedAt && { createdAt: { $gte: opts.startUpdatedAt } }),
      ...(opts.endUpdatedAt && { createdAt: { $lte: opts.endUpdatedAt } }),
    }

    return {
      currentCursor: opts.cursor || null,
      sort: { [sortBy]: sortOrder },
      limit,
      query,
    }
  }

  async paginate(opts: TBuiltPaginationOptions): Promise<TPaginatedResponseWithCursor<T>> {
    const items = await this.model
      .find(opts.query)
      .sort(opts.sort)
      .limit(opts.limit + 1)
      .lean()
    const hasNextPage = items.length > opts.limit
    const results = hasNextPage ? items.slice(0, -1) : items
    const lastItem = results[results.length - 1]

    const cursorField = opts.sort ? Object.keys(opts.sort)[0] : '_id'
    const nextCursor = hasNextPage ? Buffer.from(String(lastItem[cursorField])).toString('hex') : null

    return {
      items: results.map((item) => ({ ...item, id: String(item._id) })),
      cursor: {
        current: opts.currentCursor,
        next: nextCursor,
      },
    }
  }
}
