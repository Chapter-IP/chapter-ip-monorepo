import { ConfigService } from '@nestjs/config'
import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc'
import { TRPCError } from '@trpc/server'
import { extension } from 'mime-types'

import { NOTIFICATION_TYPE } from '@repo/notifications'

import { AuthMiddleware } from '../common/auth/auth.middleware.js'
import type { TAppContextWithTokenPayload } from '../common/auth/auth.types.js'
import { CommonEvmService } from '../common/evm/evm.service.js'
import { CommonNotificationService } from '../common/notification/notification.service.js'
import { ContentService } from './content.service.js'
import { ContentModelService } from './content-model.service.js'
import { ContentStatus } from './content.schema.js'
import { FileService } from './file/file.service.js'
import { PurchaseHistoryService } from './purchase-history/purchase-history.service.js'
import {
  createContentFileUploadUrlInputSchema,
  createUserFileUploadUrlInputSchema,
  findContentInputSchema,
  findContentOutputSchema,
  findPurchaseHistoryInputSchema,
  findPurchaseHistoryOutputSchema,
  type TFindPurchaseHistoryInput,
  type TFindPurchaseHistoryOutput,
  getContentByIdInputSchema,
  getContentByIdOutputSchema,
  getContentConfigOutputSchema,
  getContentAllFilesLinkInputSchema,
  getContentAllFilesLinkOutputSchema,
  getContentFileLinkInputSchema,
  getContentFileLinkOutputSchema,
  getContentStatisticInputSchema,
  getContentStatisticOutputSchema,
  presignedPutOutputSchema,
  registerContentFileInputSchema,
  registerContentFileOutputSchema,
  registerContentInputSchema,
  registerContentOutputSchema,
  removeContentFileInputSchema,
  removeContentFileOutputSchema,
  removeContentInputSchema,
  removeContentOutputSchema,
  requestLazyMintContentTokenInputSchema,
  requestLazyMintContentTokenOutputSchema,
  type TCreateContentFileUploadUrlInput,
  type TCreateUserFileUploadUrlInput,
  type TFindContentInput,
  type TFindContentOutput,
  type TGetContentByIdInput,
  type TGetContentByIdOutput,
  type TGetContentConfigOutput,
  type TGetContentAllFilesLinkInput,
  type TGetContentAllFilesLinkOutput,
  type TGetContentFileLinkInput,
  type TGetContentFileLinkOutput,
  type TGetContentStatisticInput,
  type TGetContentStatisticOutput,
  type TPresignedPutOutput,
  type TRegisterContentFileInput,
  type TRegisterContentFileOutput,
  type TRegisterContentInput,
  type TRegisterContentOutput,
  type TRemoveContentFileInput,
  type TRemoveContentFileOutput,
  type TRemoveContentInput,
  type TRemoveContentOutput,
  type TRequestLazyMintContentTokenInput,
  type TRequestLazyMintContentTokenOutput,
  type TUpdateContentMetadataInput,
  type TUploadTokenMetadataInput,
  type TUploadTokenMetadataOutput,
  updateContentMetadataInputSchema,
  updateContentMetadataOutputSchema,
  uploadTokenMetadataInputSchema,
  uploadTokenMetadataOutputSchema,
} from './content.dto.js'

@Router({ alias: 'contents' })
export class ContentRouter {
  constructor(
    private readonly configService: ConfigService,
    private readonly contentService: ContentModelService,
    private readonly fileService: FileService,
    private readonly commonEvmService: CommonEvmService,
    private readonly commonContentService: ContentService,
    private readonly commonNotificationService: CommonNotificationService,
    private readonly purchaseHistoryService: PurchaseHistoryService,
  ) {}

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: createUserFileUploadUrlInputSchema,
    output: presignedPutOutputSchema,
  })
  async createUserFileUploadUrl(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TCreateUserFileUploadUrlInput,
  ): Promise<TPresignedPutOutput> {
    const ext = input.extension ? input.extension.replaceAll('.', '') : extension(input.mimetype)
    if (!ext) {
      throw new TRPCError({ message: 'Invalid mimetype', code: 'BAD_REQUEST' })
    }

    const key = `${ctx.authTokenPayload.sub}/${input.filename}.${ext}`
    const url = await this.fileService.createUploadUrl({
      Bucket: this.fileService.getBucketName(input.bucket),
      Key: key,
      ContentType: input.mimetype,
    })
    return { url, key }
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: createContentFileUploadUrlInputSchema,
    output: presignedPutOutputSchema,
  })
  async createContentFileUploadUrl(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TCreateContentFileUploadUrlInput,
  ): Promise<TPresignedPutOutput> {
    const ext = input.extension ? input.extension.replaceAll('.', '') : extension(input.mimetype)
    if (!ext) {
      throw new TRPCError({ message: 'Invalid mimetype', code: 'BAD_REQUEST' })
    }
    const [isOwner, message] = await this.commonContentService.verifyIsOwnerById(
      ctx.authTokenPayload.sub,
      input.contentId,
    )
    if (!isOwner) {
      throw new TRPCError({ message, code: 'FORBIDDEN' })
    }

    const key = `${await this.commonContentService.getContentNftContractAddress()}/${input.contentId}/${input.filename}.${ext}`
    const url = await this.fileService.createUploadUrl({
      Bucket: this.fileService.getBucketName(input.bucket),
      Key: key,
      ContentType: input.mimetype,
    })
    return { url, key }
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: registerContentInputSchema,
    output: registerContentOutputSchema,
  })
  async registerContent(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TRegisterContentInput,
  ): Promise<TRegisterContentOutput> {
    const sub = ctx.authTokenPayload.sub

    if (input.tokenId) {
      const subEvmAddress = await this.commonEvmService.getUserEvmAddressBySub(sub)
      const [isOwner, message] = await this.commonContentService.verifyIsOwner(subEvmAddress, input.tokenId)
      if (!isOwner) {
        throw new TRPCError({ message: message ?? 'Forbidden', code: 'FORBIDDEN' })
      }
    }

    const contractAddress = await this.commonContentService.getContentNftContractAddress()

    const contentDoc = await this.contentService.create({
      sub,
      ...(input.tokenId && { tokenId: input.tokenId }),
      contractAddress,
      metadata: input.metadata,
      tags: input.tags,
      status: input.tokenId ? (input.status ?? ContentStatus.ACTIVE) : ContentStatus.DRAFT,
    })

    void this.commonNotificationService.getModel().create({
      sub,
      type: NOTIFICATION_TYPE.CONTENT_CREATED,
      payload: { content: { metadata: contentDoc.metadata, _id: contentDoc.id } },
    })

    return contentDoc
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: updateContentMetadataInputSchema,
    output: updateContentMetadataOutputSchema,
  })
  async updateContentMetadata(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TUpdateContentMetadataInput,
  ): Promise<TRegisterContentOutput> {
    const [isOwner, message] = await this.commonContentService.verifyIsOwnerById(
      ctx.authTokenPayload.sub,
      input.contentId,
    )
    if (!isOwner) {
      throw new TRPCError({ message, code: 'FORBIDDEN' })
    }

    const existing = await this.contentService.findById(input.contentId)
    const tokenId = existing?.tokenId ?? input.tokenId

    const updated = await this.contentService.updateById(input.contentId, {
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(tokenId ? { tokenId } : {}),
      ...(input.status ? { status: input.status } : {}),
    })

    return updated!
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: registerContentFileInputSchema,
    output: registerContentFileOutputSchema,
  })
  async registerContentFile(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TRegisterContentFileInput,
  ): Promise<TRegisterContentFileOutput> {
    const [isOwner, message] = await this.commonContentService.verifyIsOwnerById(
      ctx.authTokenPayload.sub,
      input.contentId,
    )
    if (!isOwner) {
      throw new TRPCError({ message, code: 'FORBIDDEN' })
    }

    const expectedPrefix = `${await this.commonContentService.getContentNftContractAddress()}/${input.contentId}/`
    if (!input.key.startsWith(expectedPrefix)) {
      throw new TRPCError({
        message: `Invalid key. Must be under the content folder "${expectedPrefix}"`,
        code: 'BAD_REQUEST',
      })
    }

    const bucket = this.fileService.getBucketName(input.bucket)
    const existsInStorage = await this.fileService.objectExists({
      Bucket: bucket,
      Key: input.key,
    })
    if (!existsInStorage) {
      throw new TRPCError({ message: 'Object is not found in storage', code: 'NOT_FOUND' })
    }

    const fileData = {
      contentId: input.contentId,
      label: input.label ?? '',
      filename: input.filename,
      mimetype: input.mimetype,
      bucket,
      key: input.key,
    }

    const existingKey = await this.fileService.findOne({ key: input.key, bucket })
    if (existingKey) {
      return (await this.fileService.updateById(existingKey.id, fileData))!
    } else {
      return await this.fileService.create(fileData)
    }
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: removeContentFileInputSchema,
    output: removeContentFileOutputSchema,
  })
  async removeContentFile(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TRemoveContentFileInput,
  ): Promise<TRemoveContentFileOutput> {
    const contentFile = await this.fileService.findById(input.fileId)

    if (!contentFile) {
      throw new TRPCError({ message: 'File is not found', code: 'NOT_FOUND' })
    }

    const [isOwner, message] = await this.commonContentService.verifyIsOwnerById(
      ctx.authTokenPayload.sub,
      contentFile.contentId,
    )
    if (!isOwner) {
      throw new TRPCError({ message, code: 'FORBIDDEN' })
    }

    return await this.commonContentService.removeContentFile(contentFile)
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: removeContentInputSchema,
    output: removeContentOutputSchema,
  })
  async removeContent(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TRemoveContentInput,
  ): Promise<TRemoveContentOutput> {
    const [isOwner, message] = await this.commonContentService.verifyIsOwnerById(
      ctx.authTokenPayload.sub,
      input.contentId,
    )
    if (!isOwner) {
      throw new TRPCError({ message, code: 'FORBIDDEN' })
    }

    return await this.commonContentService.removeContent(input.contentId)
  }

  @Query({
    input: findContentInputSchema,
    output: findContentOutputSchema,
  })
  async findContent(@Input() input: TFindContentInput): Promise<TFindContentOutput> {
    const paginationOptions = this.contentService.buildPaginationOptions(input)

    const res = await this.contentService.paginate(paginationOptions)
    return res
  }

  @Query({
    input: getContentByIdInputSchema,
    output: getContentByIdOutputSchema,
  })
  async getContentById(@Input() input: TGetContentByIdInput): Promise<TGetContentByIdOutput> {
    const content = await this.contentService.findById(input.id)
    if (!content) {
      throw new TRPCError({ message: 'Content is not found', code: 'NOT_FOUND' })
    }

    const [files, similarContents] = await Promise.all([
      this.fileService.find({ contentId: content._id }),
      this.contentService.findSimilarByTags(content.id, content.tags ?? []),
    ])
    return {
      ...content.toJSON(),
      files,
      similarContents,
    }
  }

  @Query({
    input: getContentStatisticInputSchema,
    output: getContentStatisticOutputSchema,
  })
  async getContentStatistic(@Input() input: TGetContentStatisticInput): Promise<TGetContentStatisticOutput> {
    return await this.commonContentService.getContentStatistic(input.tokenId)
  }

  @UseMiddlewares(AuthMiddleware)
  @Query({
    input: getContentFileLinkInputSchema,
    output: getContentFileLinkOutputSchema,
  })
  async getContentFileLink(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TGetContentFileLinkInput,
  ): Promise<TGetContentFileLinkOutput> {
    const fileQuery = {
      ...(input.key ? { key: input.key } : {}),
      ...(input.id ? { _id: input.id } : {}),
    }
    const contentFile = await this.fileService.findOne(fileQuery)
    if (!contentFile) {
      throw new TRPCError({ message: 'File is not found', code: 'NOT_FOUND' })
    }

    const [hasAccess, err] = await this.commonContentService.verifyContentFileAccess(
      ctx.authTokenPayload.sub,
      contentFile.contentId,
      input.licenseTokenId,
    )
    if (!hasAccess) {
      throw new TRPCError({ message: err ?? 'Forbidden', code: 'FORBIDDEN' })
    }

    const url = await this.fileService.getSignedObjectUrl({
      Bucket: contentFile.bucket,
      Key: contentFile.key,
    })

    return { url }
  }

  @UseMiddlewares(AuthMiddleware)
  @Query({
    input: getContentAllFilesLinkInputSchema,
    output: getContentAllFilesLinkOutputSchema,
  })
  async getContentAllFilesLink(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TGetContentAllFilesLinkInput,
  ): Promise<TGetContentAllFilesLinkOutput> {
    const [hasAccess, err] = await this.commonContentService.verifyContentFileAccess(
      ctx.authTokenPayload.sub,
      input.contentId,
      input.licenseTokenId,
    )
    if (!hasAccess) {
      throw new TRPCError({ message: err ?? 'Forbidden', code: 'FORBIDDEN' })
    }

    const files = await this.fileService.find({ contentId: input.contentId })
    const fileLinks = await Promise.all(
      files.map(async (file) => ({
        id: file.id,
        label: file.label,
        filename: file.filename,
        mimetype: file.mimetype,
        bucket: file.bucket,
        key: file.key,
        url: await this.fileService.getSignedObjectUrl({
          Bucket: file.bucket,
          Key: file.key,
        }),
      })),
    )

    return { files: fileLinks }
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: uploadTokenMetadataInputSchema,
    output: uploadTokenMetadataOutputSchema,
  })
  async uploadTokenMetadata(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TUploadTokenMetadataInput,
  ): Promise<TUploadTokenMetadataOutput> {
    const contractAddress = await this.commonContentService.getContentNftContractAddress()
    const contentDoc = await this.contentService.findOne({
      contractAddress,
      tokenId: input.tokenId,
      sub: ctx.authTokenPayload.sub,
    })
    if (!contentDoc) {
      throw new TRPCError({ message: 'Content is not found or is not yours', code: 'NOT_FOUND' })
    }

    const metadataKey = `${contractAddress}/${[input.tokenId, 'json'].join('.')}`
    await this.fileService.putObject({
      Body: JSON.stringify(input.metadata, null, 2),
      ContentType: 'application/json',
      Bucket: this.fileService.getBucketName('metadata'),
      Key: metadataKey,
    })

    const metadataBucketHost = this.configService.get<string>('cloudflare.rtwo.metadataBucketHost')
    return { url: `${metadataBucketHost}/${metadataKey}` }
  }

  @UseMiddlewares(AuthMiddleware)
  @Mutation({
    input: requestLazyMintContentTokenInputSchema,
    output: requestLazyMintContentTokenOutputSchema,
  })
  async requestLazyMintContentToken(
    @Input() input: TRequestLazyMintContentTokenInput,
  ): Promise<TRequestLazyMintContentTokenOutput> {
    try {
      return await this.commonContentService.requestLazyMintContentTokenVoucher(input.uri, input.licenseType)
    } catch (err) {
      throw new TRPCError({
        message: (err as Error).message,
        code: 'INTERNAL_SERVER_ERROR',
      })
    }
  }

  @UseMiddlewares(AuthMiddleware)
  @Query({
    input: findPurchaseHistoryInputSchema,
    output: findPurchaseHistoryOutputSchema,
  })
  async findPurchaseHistory(
    @Ctx() ctx: TAppContextWithTokenPayload,
    @Input() input: TFindPurchaseHistoryInput,
  ): Promise<TFindPurchaseHistoryOutput> {
    const paginationOptions = this.purchaseHistoryService.buildPaginationOptions({
      ...input,
      ownerId: ctx.authTokenPayload.sub,
    })
    const result = await this.purchaseHistoryService.paginate(paginationOptions)
    const totalCount = await this.purchaseHistoryService.count({
      ownerId: ctx.authTokenPayload.sub,
      ...(input.contentId && { contentId: input.contentId }),
    })
    return { ...result, totalCount }
  }

  @Query({
    output: getContentConfigOutputSchema,
  })
  async config(): Promise<TGetContentConfigOutput> {
    const [contentNftAddress, network] = await Promise.all([
      this.commonContentService.getContentNftContractAddress(),
      this.commonEvmService.getProvider().getNetwork(),
    ])
    const licenseNftAddress = this.configService.get<string>('evm.licenseNftContractAddress')
    const membershipAddress = this.configService.get<string>('evm.membershipContractAddress')
    const env = this.configService.get<string>('env')

    return {
      contractAddresses: {
        contentNft: contentNftAddress,
        licenseNft: licenseNftAddress!.toLowerCase(),
        membership: membershipAddress!.toLowerCase(),
      },
      chainId: Number(network.chainId),
      env: env!,
    }
  }
}
