import { describe, expect, it } from 'vitest'
import { getPreviewUrl } from '../location/location'
import { toPurchaseRow, toPurchaseRows } from './rows'
import type { PurchasedContentToken } from './types'

const CONTRACT_ADDRESS = '0xcontent'

const likenessPurchase: PurchasedContentToken = {
  id: 'likeness-1',
  tokenId: '101',
  contentTokenId: 101,
  sub: 'publisher-1',
  metadata: {
    type: 'likeness',
    profile: {
      fullLegalName: 'Avery Stone',
      stageName: 'Avery',
      bio: 'Actor and vocalist.',
    },
    licensing: {
      licenseTypes: { 'single-use': true },
      licensePrices: { 'single-use': '10' },
    },
    uploadsByBucket: { headshots: ['headshot_1'] },
  },
  files: [],
  licenseType: '2',
  licenseTokenId: '44',
  isBlocked: false,
  blockedGraceEndsAt: null,
}

const locationPurchase: PurchasedContentToken = {
  id: 'location-1',
  tokenId: '202',
  contentTokenId: 202,
  sub: 'publisher-2',
  tags: ['Baseball'],
  metadata: {
    type: 'location',
    name: 'Citi Field',
    description: 'A baseball stadium in Queens, New York.',
    preview_file_name: 'citi-field.jpg',
    licensing: {
      licenseTypes: { 'single-use': true, perpetual: true },
      licensePrices: { 'single-use': '6000' },
      agreedToFee: true,
    },
  },
  files: [],
  licenseType: '2',
  licenseTokenId: '55',
  isBlocked: false,
  blockedGraceEndsAt: null,
}

const workPurchase: PurchasedContentToken = {
  ...locationPurchase,
  id: 'work-1',
  tokenId: '303',
  contentTokenId: 303,
  sub: 'publisher-3',
  licenseTokenId: '66',
  metadata: {
    type: 'works',
    name: 'Pendulum',
    contentType: 'Script',
    description: 'A thriller.',
    authors: ['Chadwick Bowser'],
    genre: ['Thriller'],
    files_name: ['pendulum.pdf'],
    licensing: {
      licenseTypes: { 'single-use': true },
      licensePrices: { 'single-use': '25' },
      agreedToFee: true,
    },
  },
}

describe('purchase rows', () => {
  it('maps likeness and location purchases into unified rows', () => {
    const rows = toPurchaseRows([likenessPurchase, locationPurchase], CONTRACT_ADDRESS, {
      'publisher-2': 'The City of New York',
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      item: {
        type: 'likeness',
        categoryLabel: 'Likeness',
        name: 'Avery Stone',
        byline: 'by Avery',
      },
    })
    expect(rows[1]).toMatchObject({
      item: {
        type: 'location',
        categoryLabel: 'Location',
        name: 'Citi Field',
        byline: 'by The City of New York',
      },
    })
    expect(rows[1]?.item.image.src).toBe(getPreviewUrl(CONTRACT_ADDRESS, 'location-1', 'citi-field.jpg'))
  })

  it('ignores unsupported content types', () => {
    expect(
      toPurchaseRow(
        {
          ...likenessPurchase,
          metadata: { type: 'written-works' },
        },
        CONTRACT_ADDRESS,
      ),
    ).toEqual([])
  })

  it('maps creative work purchases for license details and downloads', () => {
    const [row] = toPurchaseRow(workPurchase, CONTRACT_ADDRESS)
    expect(row).toMatchObject({
      item: {
        type: 'works',
        categoryLabel: 'Creative Work',
        name: 'Pendulum',
        byline: 'by Chadwick Bowser',
        downloadName: 'Pendulum',
        work: {
          contentType: 'Script',
          authors: ['Chadwick Bowser'],
          genres: ['Thriller'],
          files: ['pendulum.pdf'],
        },
      },
    })
  })
})
