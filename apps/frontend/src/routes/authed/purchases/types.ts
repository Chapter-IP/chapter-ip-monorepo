import type { LikenessDetails } from '@repo/content-types/likeness'
import type { LocationDetails } from '@repo/content-types/location'
import type { WorkDetails } from '@repo/content-types/works'
import type { AppRouter, TRPCClient } from '@repo/trpc/client'

type ContentTokenMetadata = Record<string, unknown> & { type?: string }

export type PurchasedContentFile = {
  id?: string
  filename?: string
  label?: string
  mimetype?: string
  key?: string | null
}

export type DownloadableContentFile = {
  url: string
  label: string
  mimetype: string
}

export type PurchasedContentToken = {
  id: string
  tokenId: string
  contentTokenId: number
  sub?: string
  tags?: string[]
  metadata: ContentTokenMetadata
  files: PurchasedContentFile[]
  licenseType: string
  licenseTokenId: string
  isBlocked: boolean
  blockedGraceEndsAt: number | null
}

export type ContentFilesLinkClient = {
  contents: Pick<TRPCClient<AppRouter>['contents'], 'getContentAllFilesLink'>
}

export type PurchasedItemView =
  | {
      type: 'likeness'
      categoryLabel: 'Likeness'
      name: string
      byline: string
      image: { src: string; alt: string }
      downloadName: string
      likeness: LikenessDetails
    }
  | {
      type: 'location'
      categoryLabel: 'Location'
      name: string
      byline: string
      image: { src: string; alt: string }
      downloadName: string
      location: LocationDetails
    }
  | {
      type: 'works'
      categoryLabel: 'Creative Work'
      name: string
      byline: string
      image: { src: string; alt: string }
      downloadName: string
      work: WorkDetails
    }

export type PurchaseRow = {
  purchase: PurchasedContentToken
  item: PurchasedItemView
}
