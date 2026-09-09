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
  licenses: [
    { id: 'single-use', name: 'One-Time License - Single use', price: '25', description: 'One use.' },
    { id: 'perpetual', name: 'Lifetime License - Perpetual use', price: '100', description: 'Forever.' },
  ],
  image: { src: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', alt: 'Irregardless' },
  sample: { filename: 'sample.txt', url: 'https://preview.example/work-1/sample.txt' },
  permittedUses: ['Print', 'TV/Film'],
  additionalTerms: ['Attribution required'],
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
  const screen = await render(WorkPurchasePage, { workDetails: { ...workDetails, contentType: 'Script' } })

  await expect.element(screen.getByText('First verse\n\nSecond verse', { exact: true })).toBeVisible()
  const fullSample = screen.getByRole('link', { name: /Read full sample/ })
  await expect.element(fullSample).toHaveAttribute('href', workDetails.sample?.url ?? '')
  await expect.element(fullSample).toHaveAttribute('target', '_blank')
  await expect.element(screen.getByText('Lifetime License - Perpetual use')).toBeVisible()
  await expect.element(screen.getByText('Print', { exact: true })).toBeVisible()
  await expect.element(screen.getByText('TV/Film', { exact: true })).toBeVisible()
  await expect.element(screen.getByText('Attribution required', { exact: true })).toBeVisible()

  const purchaseButton = screen.getByRole('button', { name: 'Buy License' })
  await expect.element(purchaseButton).toBeEnabled()
  await purchaseButton.click()
  expect(purchaseLicenseMock).toHaveBeenCalledOnce()
})

test('keeps the full sample link and purchase enabled when extraction fails', async () => {
  extractTextFromFileMock.mockRejectedValueOnce(new Error('broken sample'))
  const screen = await render(WorkPurchasePage, { workDetails: { ...workDetails, contentType: 'Script' } })

  await expect.element(screen.getByText('The sample preview could not be displayed.')).toBeVisible()
  await expect.element(screen.getByRole('link', { name: /Read full sample/ })).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Buy License' })).toBeEnabled()
})

test('shows Lyrics from saved text, expands the full text, and purchases the chosen license', async () => {
  const lyrics = 'First verse\n'.repeat(140) + 'Last verse'
  const screen = await render(WorkPurchasePage, { workDetails: { ...workDetails, sampleText: lyrics } })
  await expect.element(screen.getByRole('button', { name: 'Show more' })).toBeVisible()
  expect(fetch).not.toHaveBeenCalled()
  await expect.element(screen.getByRole('radio', { name: /Lifetime License/ })).toBeChecked()
  await screen.getByRole('button', { name: 'Show more' }).click()
  await expect.element(screen.getByText(/Last verse/)).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
  await screen.getByRole('radio', { name: /One-Time License/ }).click()
  await screen.getByRole('button', { name: 'Buy License' }).click()
  expect(purchaseLicenseMock).toHaveBeenCalledWith(
    expect.objectContaining({ license: expect.objectContaining({ id: 'single-use', price: '25' }) }),
  )
})

test('ignores unsupported licenses and disables buying without a supported choice', async () => {
  const screen = await render(WorkPurchasePage, {
    workDetails: {
      ...workDetails,
      licenses: [{ id: 'ai-training', name: 'AI Training', price: '50', description: '' }],
      sample: undefined,
    },
  })
  await expect.element(screen.getByText('No licensing options are currently available.')).toBeVisible()
  await expect.element(screen.getByRole('button', { name: 'Buy License' })).not.toBeInTheDocument()
})
