import { z } from 'zod'

import { paginatedRequestWithCursorSchema, createPaginatedResponseSchema } from '../common/model/model.dto'
import { ContentStatus } from './content.schema'

export const contentMetadataRecordSchema = z.record(z.string(), z.any()).optional()

export const uploadTokenMetadataInputSchema = z.object({
  tokenId: z.string(),
  metadata: z
    .object({})
    .catchall(z.any())
    .refine((obj) => Object.keys(obj).length > 0, {
      message: `'metadata' object cannot be empty`,
    }),
})
export type TUploadTokenMetadataInput = z.infer<typeof uploadTokenMetadataInputSchema>

export const uploadTokenMetadataOutputSchema = z.object({
  url: z.string(),
})
export type TUploadTokenMetadataOutput = z.infer<typeof uploadTokenMetadataOutputSchema>

export const presignedPutOutputSchema = z.object({
  url: z.string(),
  key: z.string(),
})
export type TPresignedPutOutput = z.infer<typeof presignedPutOutputSchema>

export const createUserFileUploadUrlInputSchema = z.object({
  filename: z.string(),
  mimetype: z.string(),
  extension: z.string().optional(),
  bucket: z.enum(['userfiles']).default('userfiles'),
})
export type TCreateUserFileUploadUrlInput = z.infer<typeof createUserFileUploadUrlInputSchema>

export const createContentFileUploadUrlInputSchema = z.object({
  contentId: z.string(),
  mimetype: z.string(),
  filename: z.string(),
  extension: z.string().optional(),
  bucket: z.enum(['content', 'preview']).default('content'),
})
export type TCreateContentFileUploadUrlInput = z.infer<typeof createContentFileUploadUrlInputSchema>

export const registerContentInputSchema = z.object({
  tokenId: z.string().optional(),
  metadata: contentMetadataRecordSchema,
  tags: z.array(z.string()).optional(),
  status: z.enum(ContentStatus).optional(),
})
export type TRegisterContentInput = z.infer<typeof registerContentInputSchema>

export const registerContentOutputSchema = z.object({
  id: z.string(),
  sub: z.string(),
  tokenId: z.string().optional(),
  contractAddress: z.string(),
  metadata: contentMetadataRecordSchema,
  tags: z.array(z.string()).optional(),
  status: z.enum(ContentStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type TRegisterContentOutput = z.infer<typeof registerContentOutputSchema>

export const updateContentMetadataInputSchema = z.object({
  contentId: z.string(),
  tokenId: z.string().optional(),
  metadata: contentMetadataRecordSchema,
  tags: z.array(z.string()).optional(),
  status: z.enum(ContentStatus).optional(),
})
export type TUpdateContentMetadataInput = z.infer<typeof updateContentMetadataInputSchema>

export const updateContentMetadataOutputSchema = registerContentOutputSchema
export type TUpdateContentMetadataOutput = z.infer<typeof updateContentMetadataOutputSchema>

export const registerContentFileInputSchema = z.object({
  contentId: z.string(),
  key: z.string(),
  bucket: z.enum(['content', 'preview']).default('content'),
  label: z.string().default(''),
  filename: z.string(),
  mimetype: z.string(),
})
export type TRegisterContentFileInput = z.infer<typeof registerContentFileInputSchema>

export const contentFileOutputSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  label: z.string(),
  filename: z.string(),
  mimetype: z.string(),
  bucket: z.string(),
  key: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type TContentFileOutput = z.infer<typeof contentFileOutputSchema>

export const registerContentFileOutputSchema = contentFileOutputSchema
export type TRegisterContentFileOutput = z.infer<typeof registerContentFileOutputSchema>

export const removeContentFileInputSchema = z.object({
  fileId: z.string(),
})
export type TRemoveContentFileInput = z.infer<typeof removeContentFileInputSchema>

export const removeContentFileOutputSchema = z.object({
  ok: z.literal(true),
})
export type TRemoveContentFileOutput = z.infer<typeof removeContentFileOutputSchema>

export const removeContentInputSchema = z.object({
  contentId: z.string(),
})
export type TRemoveContentInput = z.infer<typeof removeContentInputSchema>

export const removeContentOutputSchema = z.object({
  ok: z.literal(true),
})
export type TRemoveContentOutput = z.infer<typeof removeContentOutputSchema>

export const contentOutputSchema = registerContentOutputSchema.extend({
  files: z.array(contentFileOutputSchema),
})
export type TContentOutput = z.infer<typeof contentOutputSchema>

export const filterOpSchema = z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'exists', 'regex'])
export type TFilterOp = z.infer<typeof filterOpSchema>

export const filterConditionSchema = z
  .object({
    field: z.string().min(1),
    op: filterOpSchema,
    val: z.any(),
  })
  .superRefine((data, ctx) => {
    if ((data.op === 'in' || data.op === 'nin') && !Array.isArray(data.val)) {
      ctx.addIssue({
        code: 'custom',
        message: `'val' must be an array for the '${data.op}' operator`,
        path: ['val'],
      })
    }
    if (data.op === 'exists' && typeof data.val !== 'boolean') {
      ctx.addIssue({
        code: 'custom',
        message: `'val' must be a boolean for the 'exists' operator`,
        path: ['val'],
      })
    }
    if (data.op === 'regex' && typeof data.val !== 'string') {
      ctx.addIssue({
        code: 'custom',
        message: `'val' must be a string for the 'regex' operator`,
        path: ['val'],
      })
    }
  })
export type TFilterCondition = z.infer<typeof filterConditionSchema>

export type TFilterNode = TFilterCondition | { and: TFilterNode[] } | { or: TFilterNode[] }

export const filterNodeSchema: z.ZodType<TFilterNode> = z.lazy(() =>
  z.union([
    filterConditionSchema,
    z.object({ and: z.array(filterNodeSchema).min(1) }),
    z.object({ or: z.array(filterNodeSchema).min(1) }),
  ]),
)

export const findContentInputSchema = paginatedRequestWithCursorSchema.extend({
  sub: z.string().optional(),
  tokenId: z.string().optional(),
  contractAddress: z.string().optional(),
  metadata: filterNodeSchema.optional(),
  status: z.string().optional(),
})
export type TFindContentInput = z.infer<typeof findContentInputSchema>

export const findContentOutputSchema = createPaginatedResponseSchema(registerContentOutputSchema)
export type TFindContentOutput = z.infer<typeof findContentOutputSchema>

export const getContentByIdInputSchema = z.object({
  id: z.string(),
})
export type TGetContentByIdInput = z.infer<typeof getContentByIdInputSchema>

export const getContentByIdOutputSchema = contentOutputSchema.extend({
  similarContents: z.array(registerContentOutputSchema),
})
export type TGetContentByIdOutput = z.infer<typeof getContentByIdOutputSchema>

export const getContentFileLinkInputSchema = z
  .object({
    key: z.string().optional(),
    id: z.string().optional(),
    licenseTokenId: z.string().optional(),
  })
  .refine((data) => Boolean(data.id || data.key), {
    message: 'Either `id` or `key` must be provided.',
    path: ['key'],
  })
export type TGetContentFileLinkInput = z.infer<typeof getContentFileLinkInputSchema>

export const getContentFileLinkOutputSchema = z.object({
  url: z.string(),
})
export type TGetContentFileLinkOutput = z.infer<typeof getContentFileLinkOutputSchema>

export const getContentAllFilesLinkInputSchema = z.object({
  contentId: z.string(),
  licenseTokenId: z.string().optional(),
})
export type TGetContentAllFilesLinkInput = z.infer<typeof getContentAllFilesLinkInputSchema>

export const getContentAllFilesLinkOutputSchema = z.object({
  files: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      url: z.string(),
      filename: z.string(),
      mimetype: z.string(),
      bucket: z.string(),
      key: z.string(),
    }),
  ),
})
export type TGetContentAllFilesLinkOutput = z.infer<typeof getContentAllFilesLinkOutputSchema>

export const requestLazyMintContentTokenInputSchema = z.object({
  uri: z.string(),
  licenseType: z.union([z.literal(0), z.literal(2)]),
})
export type TRequestLazyMintContentTokenInput = z.infer<typeof requestLazyMintContentTokenInputSchema>

export const contentNftLazyMintVoucherSchema = z.object({
  nonce: z.string(),
  price: z.string(),
  priceToken: z.string(),
  licenseInfo: z.string(),
  uri: z.string(),
})

export const requestLazyMintContentTokenOutputSchema = z.object({
  sig: z.string(),
  domain: z.object({
    name: z.string(),
    version: z.string(),
    chainId: z.number(),
    verifyingContract: z.string(),
  }),
  voucher: contentNftLazyMintVoucherSchema,
})
export type TRequestLazyMintContentTokenOutput = z.infer<typeof requestLazyMintContentTokenOutputSchema>

export const getContentStatisticInputSchema = z.object({
  tokenId: z.string(),
})
export type TGetContentStatisticInput = z.infer<typeof getContentStatisticInputSchema>

export const getContentStatisticOutputSchema = z.object({
  tokenId: z.string(),
  boughtLicensesAmount: z.number().int().nonnegative(),
  revenue: z.object({
    fiat: z.string(),
    eth: z.string(),
    token: z.string(),
  }),
})
export type TGetContentStatisticOutput = z.infer<typeof getContentStatisticOutputSchema>

export const purchaseHistoryItemOutputSchema = z.object({
  id: z.string(),
  buyerAddress: z.string(),
  contentId: z.string(),
  licenseType: z.number().int().nonnegative(),
  priceFiat: z.string().optional(),
  priceToken: z.string().optional(),
  txHash: z.string(),
  priceEther: z.string().optional(),
  currencyTokenContract: z.string().optional(),
  platformFeeAmount: z.string().optional(),
  agencyFeeAmount: z.string().optional(),

  metadata: contentMetadataRecordSchema,
  ownerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type TPurchaseHistoryItemOutput = z.infer<typeof purchaseHistoryItemOutputSchema>

export const findPurchaseHistoryInputSchema = paginatedRequestWithCursorSchema.extend({
  contentId: z.string().optional(),
})
export type TFindPurchaseHistoryInput = z.infer<typeof findPurchaseHistoryInputSchema>

export const findPurchaseHistoryOutputSchema = createPaginatedResponseSchema(purchaseHistoryItemOutputSchema).extend({
  totalCount: z.number().int().nonnegative(),
})
export type TFindPurchaseHistoryOutput = z.infer<typeof findPurchaseHistoryOutputSchema>

export const getContentConfigOutputSchema = z.object({
  contractAddresses: z.object({
    contentNft: z.string(),
    licenseNft: z.string(),
    membership: z.string(),
  }),
  chainId: z.number().int().positive(),
  env: z.string(),
})
export type TGetContentConfigOutput = z.infer<typeof getContentConfigOutputSchema>
