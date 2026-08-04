export type ContentFile = {
  id: string
  filename: string
  label: string
  mimetype: string
}

export type Content<TMetadata = Record<string, unknown>> = {
  id: string
  tokenId?: string
  tags?: string[]
  sub?: string
  status?: string
  contractAddress?: string
  metadata?: TMetadata
  files?: ContentFile[]
}

export const LICENSE_TYPE_VALUES = {
  oneTime: 2,
  lifetime: 0,
} as const

export const FIAT_PRICE_MULTIPLIER = 100
export const TOKEN_PRICE_MULTIPLIER = 10 ** 6

export type ContentPrices = {
  oneTimePrice: number
  lifetimePrice?: number
}
