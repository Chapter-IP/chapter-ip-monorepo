import { Logger } from '@nestjs/common'
import { Router, Mutation, Query, Input, Ctx, UseMiddlewares } from 'nestjs-trpc'
import { TRPCError } from '@trpc/server'

import { AuthMiddleware } from '../common/auth/auth.middleware.js'
import type { TAppContextWithTokenPayload } from '../common/auth/auth.types.js'

import { PublisherService } from './publisher.service.js'
import {
  setPublisherInputSchema,
  type TSetPublisherInput,
  setPublisherOutputSchema,
  type TSetPublisherOutput,
  getPublisherDataInputSchema,
  type TGetPublisherDataInput,
  getPublisherDataOutputSchema,
  type TGetPublisherDataOutput,
  findPublishersInputSchema,
  type TFindPublishersInput,
  findPublishersOutputSchema,
  type TFindPublishersOutput,
  getMyBalanceOutputSchema,
  type TGetMyBalanceOutput,
  mintContentNftTokenInputSchema,
  type TMintContentNftTokenInput,
  mintContentNftTokenOutputSchema,
  type TMintContentNftTokenOutput,
} from './publisher.dto.js'
import { CommonEvmService } from '../common/evm/evm.service.js'

@Router({ alias: 'publishers' })
export class PublisherRouter {
  private logger = new Logger(this.constructor.name)

  constructor(
    private readonly publisherService: PublisherService,
    private readonly commonEvmService: CommonEvmService,
  ) {}

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: setPublisherInputSchema,
    output: setPublisherOutputSchema,
  })
  async setPublisher(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TSetPublisherInput,
  ): Promise<TSetPublisherOutput> {
    const evmAddress = await this.commonEvmService.getUserEvmAddressBySub(ctx.authTokenPayload.sub)

    const publisher = await this.publisherService.getModel().findOneAndUpdate(
      { sub: ctx.authTokenPayload.sub },
      {
        title: input.title,
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        evmAddress,
      },
      { new: true, upsert: true },
    )

    if (!publisher) {
      throw new TRPCError({ message: 'Failed to set publisher data', code: 'INTERNAL_SERVER_ERROR' })
    }

    return publisher.toJSON()
  }

  @Query({
    input: getPublisherDataInputSchema,
    output: getPublisherDataOutputSchema,
  })
  async getPublisher(@Input() input: TGetPublisherDataInput): Promise<TGetPublisherDataOutput> {
    const query: Record<string, unknown> = {
      ...(input.sub ? { sub: input.sub } : {}),
      ...(input.id ? { _id: input.id } : {}),
    }
    const publisher = await this.publisherService.getModel().findOne(query)

    if (!publisher) {
      throw new TRPCError({ message: 'Publisher not found', code: 'NOT_FOUND' })
    }
    return publisher.toJSON()
  }

  @Query({
    input: findPublishersInputSchema,
    output: findPublishersOutputSchema,
  })
  async findPublishers(@Input() input: TFindPublishersInput): Promise<TFindPublishersOutput> {
    const paginationOptions = this.publisherService.buildPaginationOptions(input)
    return await this.publisherService.paginate(paginationOptions)
  }

  @UseMiddlewares(AuthMiddleware)
  @Query({
    output: getMyBalanceOutputSchema,
  })
  async getMyBalance(@Ctx() ctx: TAppContextWithTokenPayload): Promise<TGetMyBalanceOutput> {
    return await this.publisherService.getFiatBalance(ctx.authTokenPayload.sub)
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: mintContentNftTokenInputSchema,
    output: mintContentNftTokenOutputSchema,
  })
  async mintContentNftToken(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TMintContentNftTokenInput,
  ): Promise<TMintContentNftTokenOutput> {
    // Mock implementation - returns mock signature, domain, and voucher
    return Promise.resolve({
      sig: '0x' + '0'.repeat(130), // Mock signature (65 bytes = 130 hex chars)
      domain: {
        name: 'Chapter IP Content',
        version: '1',
        chainId: 1,
        verifyingContract: '0x073Cd140dCcB73AB117a2f747b89e1dAe390dD5E',
      },
      voucher: {
        nonce: '0',
        price: '0',
        priceToken: '0',
        licenseInfo: String(input.licenseType),
        uri: input.tokenUri || '',
      },
    })
  }
}
