import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { tick } from 'svelte'
import PurchasedItem from './PurchasedItem.svelte'
import type { PurchasedItemView, PurchasedContentToken } from './types'

vi.mock('native-file-system-adapter', () => ({
  showSaveFilePicker: vi.fn(async () => ({
    createWritable: vi.fn(async () => ({
      close: vi.fn(async () => {}),
    })),
  })),
}))

vi.mock('client-zip', () => ({
  downloadZip: vi.fn(() => ({
    body: {
      pipeTo: vi.fn(async () => {}),
    },
  })),
}))

type FilesLinkInput = {
  contentId: string
  licenseTokenId?: string
}

const likenessItem: Extract<PurchasedItemView, { type: 'likeness' }> = {
  type: 'likeness',
  categoryLabel: 'Likeness',
  name: 'Avery Stone',
  byline: 'by Avery Stone',
  downloadName: 'Avery Stone',
  image: {
    src: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    alt: 'Avery Stone preview',
  },
  likeness: {
    id: 'content-1',
    contentTokenId: '101',
    name: 'Avery Stone',
    stageName: '',
    bio: 'Actor and vocalist.',
    attributes: [{ label: 'Eye color', value: 'Brown' }],
    affiliations: [{ union: 'SAG-AFTRA', memberId: '12345' }],
    licenses: [
      {
        id: 'single-use',
        name: 'Single-use campaign',
        price: '10',
        description: 'One approved use across a single campaign.',
      },
    ],
    permittedUses: ['AI', 'Digital'],
    territories: ['United States'],
    allowRetouching: true,
    approveFinalUse: false,
    images: [
      {
        src: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
        alt: 'Avery Stone preview',
      },
    ],
    media: [],
  },
}

const locationItem: Extract<PurchasedItemView, { type: 'location' }> = {
  type: 'location',
  categoryLabel: 'Location',
  name: 'Citi Field',
  byline: 'by The City of New York',
  downloadName: 'Citi Field',
  image: {
    src: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    alt: 'Citi Field',
  },
  location: {
    id: 'location-1',
    contentTokenId: '202',
    name: 'Citi Field',
    description: 'A baseball stadium in Queens, New York.',
    tags: ['Baseball'],
    authorName: 'The City of New York',
    licenses: [
      {
        id: 'single-use',
        name: 'One-time license',
        price: '6000',
        description: 'Clears this location for a single project. One use, one payment — no ongoing rights.',
      },
    ],
    image: {
      src: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
      alt: 'Citi Field',
    },
  },
}

const purchase: PurchasedContentToken = {
  id: 'content-1',
  tokenId: '101',
  contentTokenId: 101,
  metadata: {
    type: 'likeness',
    profile: { fullLegalName: 'Avery Stone' },
  },
  files: [
    {
      id: 'file-1',
      filename: 'headshot_1',
      label: 'Headshot',
      mimetype: 'image/jpeg',
    },
  ],
  licenseType: '2',
  licenseTokenId: '44',
  isBlocked: false,
  blockedGraceEndsAt: null,
}

let queryInputs: FilesLinkInput[]

beforeEach(() => {
  queryInputs = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.close()
        },
      }),
    })),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function getTrpcClient() {
  return {
    contents: {
      getContentAllFilesLink: {
        query: async (input: FilesLinkInput) => {
          queryInputs.push(input)
          return {
            files: [
              {
                id: 'file-1',
                label: 'Headshot',
                url: 'https://r2.example/headshot',
                filename: 'headshot.jpg',
                mimetype: 'image/jpeg',
              },
              {
                id: 'file-2',
                label: 'Voice sample',
                url: 'https://r2.example/voice',
                filename: 'voice.mp3',
                mimetype: 'audio/mpeg',
              },
            ],
          }
        },
      },
    },
  }
}

test('opens likeness license details in an accessible modal', async () => {
  const screen = await render(PurchasedItem, {
    purchase,
    item: likenessItem,
    trpcClient: getTrpcClient(),
  })

  await expect.element(screen.getByRole('heading', { name: 'Avery Stone' })).toBeVisible()
  await expect.element(screen.getByText('by Avery Stone')).toBeVisible()
  await expect.element(screen.getByText('Likeness')).toBeVisible()

  await screen.getByRole('button', { name: 'View License' }).click()

  const dialog = screen.getByRole('dialog', { name: 'Avery Stone' })
  await expect.element(dialog).toBeVisible()
  await expect.element(dialog.getByText('Actor and vocalist.')).toBeVisible()
  await expect.element(dialog.getByText('Single-use campaign')).toBeVisible()
  await expect.element(dialog.getByText('$10')).toBeVisible()

  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  await tick()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
})

test('opens location license details in an accessible modal', async () => {
  const screen = await render(PurchasedItem, {
    purchase: { ...purchase, id: 'location-1', licenseTokenId: '55' },
    item: locationItem,
    trpcClient: getTrpcClient(),
  })

  await expect.element(screen.getByRole('heading', { name: 'Citi Field' })).toBeVisible()
  await expect.element(screen.getByText('by The City of New York')).toBeVisible()
  await expect.element(screen.getByText('Location')).toBeVisible()

  await screen.getByRole('button', { name: 'View License' }).click()

  const dialog = screen.getByRole('dialog', { name: 'Citi Field' })
  await expect.element(dialog).toBeVisible()
  await expect.element(dialog.getByText('A baseball stadium in Queens, New York.')).toBeVisible()
  await expect.element(dialog.getByText('One-time license')).toBeVisible()
  await expect.element(dialog.getByRole('img', { name: 'DaVinci' })).toBeVisible()
  await expect.element(dialog.getByRole('img', { name: 'Luma' })).toBeVisible()
  await expect.element(dialog.getByRole('img', { name: 'Runway' })).toBeVisible()
  await expect.element(dialog.getByRole('img', { name: 'Flowith' })).toBeVisible()
})

test('downloads content files and starts grace for one-time licenses locally', async () => {
  const screen = await render(PurchasedItem, {
    purchase,
    item: likenessItem,
    trpcClient: getTrpcClient(),
  })

  await screen.getByRole('button', { name: 'Download' }).click()

  expect(queryInputs).toEqual([{ contentId: 'content-1', licenseTokenId: '44' }])
  await expect.element(screen.getByText(/Access ends in/)).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Download' })).toBeEnabled()
})
