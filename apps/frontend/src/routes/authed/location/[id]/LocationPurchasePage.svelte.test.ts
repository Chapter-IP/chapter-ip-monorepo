import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { tick } from 'svelte'
import LocationPurchasePage from './LocationPurchasePage.svelte'
import type { LocationPurchase } from './types'

const canPurchaseLicenseMock = vi.hoisted(() => vi.fn(() => true))
const purchaseLicenseMock = vi.hoisted(() => vi.fn())

vi.mock('$lib/content/purchaseLicense', () => ({
  canPurchaseLicense: canPurchaseLicenseMock,
  purchaseLicense: purchaseLicenseMock,
}))

const locationDetails: LocationPurchase = {
  id: 'location-1',
  contentTokenId: '456',
  name: 'Citi Field',
  description: 'A baseball stadium in Queens, New York.',
  address: { street: '41 Seaver Way', apt: '', city: 'Queens', state: 'NY', zip: '11368' },
  tags: ['Baseball', 'Queens'],
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
  files: ['location_1.mov', 'location_2.mp4'],
}

beforeEach(() => {
  canPurchaseLicenseMock.mockReturnValue(true)
  purchaseLicenseMock.mockResolvedValue(undefined)
  vi.clearAllMocks()
})

test('renders location metadata, compatible platforms, and purchase action', async () => {
  const screen = await render(LocationPurchasePage, { locationDetails })

  await expect.element(screen.getByRole('heading', { name: 'Citi Field' })).toBeVisible()
  await expect.element(screen.getByText('by The City of New York')).toBeVisible()
  await expect.element(screen.getByText('A baseball stadium in Queens, New York.')).toBeVisible()
  await expect.element(screen.getByRole('heading', { name: 'Address' })).toBeVisible()
  await expect.element(screen.getByText('Street')).toBeVisible()
  await expect.element(screen.getByText('41 Seaver Way')).toBeVisible()
  await expect.element(screen.getByText('Compatible with')).toBeVisible()
  await expect.element(screen.getByText('Baseball')).toBeVisible()

  const purchaseButton = screen.getByRole('button', { name: 'Purchase' })
  await expect.element(purchaseButton).toBeVisible()
  await expect.element(purchaseButton).toBeEnabled()
  await purchaseButton.click()

  expect(purchaseLicenseMock).toHaveBeenCalledWith({
    purchase: locationDetails,
    license: locationDetails.licenses[0],
  })
})

test('opens and closes an enlarged image dialog', async () => {
  const screen = await render(LocationPurchasePage, { locationDetails })

  await screen.getByRole('button', { name: 'Enlarge Citi Field' }).click()
  await expect.element(screen.getByRole('dialog', { name: 'Enlarged location image' })).toBeVisible()

  await screen.getByRole('button', { name: 'Close image' }).click()
  expect(document.querySelector('[role="dialog"]')).toBeNull()

  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  await tick()
  expect(document.querySelector('[role="dialog"]')).toBeNull()
})
