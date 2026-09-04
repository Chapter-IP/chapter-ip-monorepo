import { DEFAULT_IMAGE_URL } from '$lib/content/image'
import type { LikenessDetails, LikenessContent } from '@repo/content-types/likeness'
import type { LocationContent, LocationDetails } from '@repo/content-types/location'
import type { WorkContent, WorkDetails } from '@repo/content-types/works'
import { normalizeLikeness } from '../likeness/[id]/likenessDetails'
import { normalizeLocation } from '../location/[id]/locationDetails'
import { normalizeWork } from '../creative-works/[id]/workDetails'
import type { PurchaseRow, PurchasedContentToken } from './types'

function toLikenessRow(purchase: PurchasedContentToken, contractAddress: string): PurchaseRow[] {
  const likeness = normalizeLikeness(
    {
      id: purchase.id,
      tokenId: purchase.tokenId,
      sub: purchase.sub ?? '',
      status: 'ACTIVE',
      contractAddress,
      metadata: purchase.metadata as LikenessContent['metadata'],
    },
    contractAddress,
  )

  if (!likeness) return []

  return [
    {
      purchase,
      item: {
        type: 'likeness',
        categoryLabel: 'Likeness',
        name: likeness.name,
        byline: `by ${likeness.stageName || likeness.name}`,
        image: likeness.images[0] ?? { src: DEFAULT_IMAGE_URL, alt: likeness.name },
        downloadName: likeness.name,
        likeness,
      },
    },
  ]
}

function toLocationRow(purchase: PurchasedContentToken, contractAddress: string, authorName: string): PurchaseRow[] {
  const location = normalizeLocation(
    {
      id: purchase.id,
      tokenId: purchase.tokenId,
      sub: purchase.sub ?? '',
      status: 'ACTIVE',
      contractAddress,
      tags: purchase.tags,
      metadata: purchase.metadata as LocationContent['metadata'],
    },
    contractAddress,
    authorName,
  )

  if (!location) return []

  return [
    {
      purchase,
      item: {
        type: 'location',
        categoryLabel: 'Location',
        name: location.name,
        byline: location.authorName ? `by ${location.authorName}` : '',
        image: location.image,
        downloadName: location.name,
        location,
      },
    },
  ]
}

function toWorkRow(purchase: PurchasedContentToken, contractAddress: string): PurchaseRow[] {
  const work = normalizeWork(
    {
      id: purchase.id,
      tokenId: purchase.tokenId,
      sub: purchase.sub ?? '',
      status: 'ACTIVE',
      contractAddress,
      metadata: purchase.metadata as WorkContent['metadata'],
    },
    contractAddress,
  )

  if (!work) return []

  return [
    {
      purchase,
      item: {
        type: 'works',
        categoryLabel: 'Creative Work',
        name: work.title,
        byline: work.authors.length ? `by ${work.authors.join(', ')}` : '',
        image: work.image,
        downloadName: work.title,
        work,
      },
    },
  ]
}

export function toPurchaseRow(
  purchase: PurchasedContentToken,
  contractAddress: string,
  authorName = '',
): PurchaseRow[] {
  const metadataType = purchase.metadata?.type

  if (metadataType === 'likeness') return toLikenessRow(purchase, contractAddress)
  if (metadataType === 'location') return toLocationRow(purchase, contractAddress, authorName)
  if (metadataType === 'works') return toWorkRow(purchase, contractAddress)

  return []
}

export function toPurchaseRows(
  purchases: PurchasedContentToken[],
  contractAddress: string,
  authorNamesBySub: Record<string, string> = {},
): PurchaseRow[] {
  return purchases.flatMap((purchase) =>
    toPurchaseRow(purchase, contractAddress, authorNamesBySub[purchase.sub ?? ''] ?? ''),
  )
}

export type { LikenessDetails, LocationDetails, WorkDetails }
