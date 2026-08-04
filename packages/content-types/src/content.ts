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
