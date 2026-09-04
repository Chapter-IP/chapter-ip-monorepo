import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import WorkPurchasePage from './WorkPurchasePage.svelte'
import type { WorkDetails } from '@repo/content-types/works'

const extractTextFromFileMock = vi.hoisted(() => vi.fn())
const canPurchaseLicenseMock = vi.hoisted(() => vi.fn(() => true))
const purchaseLicenseMock = vi.hoisted(() => vi.fn())

vi.mock('@repo/fe-services', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/fe-services')>()),
  extractTextFromFile: extractTextFromFileMock,
}))

vi.mock('$lib/content/purchaseLicense', () => ({
  canPurchaseLicense: canPurchaseLicenseMock,
  purchaseLicense: purchaseLicenseMock,
}))

const workDetails: WorkDetails = {
  id: 'work-1',
  contentTokenId: '42',
  title: 'Irregardless',
  contentType: 'Lyrics',
  description: 'A song description.',
  authors: ['Chadwick Bowser'],
  genres: [],
  licenses: [{ id: 'single-use', name: 'Single-use license', price: '25', description: 'One use.' }],
  image: { src: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', alt: 'Irregardless' },
  sample: { filename: 'sample.txt', url: 'https://preview.example/work-1/sample.txt' },
  files: ['work_1.docx'],
}

beforeEach(() => {
  vi.clearAllMocks()
  canPurchaseLicenseMock.mockReturnValue(true)
  purchaseLicenseMock.mockResolvedValue(undefined)
  extractTextFromFileMock.mockResolvedValue('First verse\n\nSecond verse')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('sample contents', { status: 200 })))
})

test('loads and renders a public sample without affecting purchase', async () => {
  const screen = await render(WorkPurchasePage, { workDetails })

  await expect.element(screen.getByText('First verse\n\nSecond verse', { exact: true })).toBeVisible()
  const fullSample = screen.getByRole('link', { name: /Read full sample/ })
  await expect.element(fullSample).toHaveAttribute('href', workDetails.sample?.url ?? '')
  await expect.element(fullSample).toHaveAttribute('target', '_blank')

  const purchaseButton = screen.getByRole('button', { name: 'Purchase' })
  await expect.element(purchaseButton).toBeEnabled()
  await purchaseButton.click()
  expect(purchaseLicenseMock).toHaveBeenCalledOnce()
})

test('keeps the full sample link and purchase enabled when extraction fails', async () => {
  extractTextFromFileMock.mockRejectedValueOnce(new Error('broken sample'))
  const screen = await render(WorkPurchasePage, { workDetails })

  await expect.element(screen.getByText('The sample preview could not be displayed.')).toBeVisible()
  await expect.element(screen.getByRole('link', { name: /Read full sample/ })).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Purchase' })).toBeEnabled()
})
