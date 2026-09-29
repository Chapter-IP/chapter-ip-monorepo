import { beforeEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { get } from 'svelte/store'
import type { ComponentProps } from 'svelte'
import CreatePage from './+page.svelte'
import EditPage from './[id]/+page.svelte'
import UploadWorkStep from './components/UploadWorkStep.svelte'
import ConfirmWorkStep from './components/ConfirmWorkStep.svelte'
import { workStore, isFormValid } from './stores/work-store'

const mocks = vi.hoisted(() => ({
  saveDraftContent: vi.fn(),
  updateContentFiles: vi.fn(),
  updateContentMetadata: vi.fn(),
  uploadPreviewFiles: vi.fn(),
  end: vi.fn(),
  goToFiles: vi.fn(),
  mintContent: vi.fn(),
  finalizeContent: vi.fn(),
  saveMetadata: vi.fn(),
  removeContentFile: vi.fn(),
}))
vi.mock('svelte-modals', () => ({
  modals: { open: vi.fn((_component: unknown, props: { onSubmit?: () => Promise<void> }) => props.onSubmit?.()) },
}))
vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), afterNavigate: vi.fn(), goto: vi.fn() }))
vi.mock('./service/work.helpers', async () => {
  const { createUploadSessionController } = await import('$lib/upload/upload-session')
  const { workStore } = await import('./stores/work-store')
  return {
    createWorkUploadServices: () => {
      const controller = createUploadSessionController(workStore)
      return {
        uploadService: {
          ...mocks,
          createTrpcClient: () => ({ contents: { removeContentFile: { mutate: mocks.removeContentFile } } }),
        },
        uploadSessions: {
          ...controller,
          begin: () => {
            const session = controller.begin()
            return {
              ...session,
              end: () => {
                mocks.end()
                session.end()
              },
            }
          },
        },
      }
    },
    goToFiles: mocks.goToFiles,
    getLicensePrices: () => ({ oneTimePrice: 25, lifetimePrice: 0 }),
    openSuccessModal: vi.fn(),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  workStore.reset()
  workStore.hydrateFromContent({ metadata: { name: 'Test work', contentType: 'Lyrics', sample_text: 'Public lyrics' } })
  mocks.saveDraftContent.mockResolvedValue({ contentId: 'work', keys: [] })
  mocks.updateContentFiles.mockResolvedValue({ keys: [] })
  mocks.updateContentMetadata.mockResolvedValue(undefined)
  mocks.mintContent.mockResolvedValue('42')
  mocks.finalizeContent.mockResolvedValue(undefined)
  mocks.saveMetadata.mockResolvedValue(undefined)
  mocks.uploadPreviewFiles.mockResolvedValue({ keys: ['preview-key'] })
  mocks.removeContentFile.mockResolvedValue({ ok: true })
})

test('create draft errors release loading so the user can retry', async () => {
  mocks.saveDraftContent.mockRejectedValueOnce(new Error('offline'))
  const screen = await render(CreatePage)
  const save = screen.getByRole('button', { name: 'Save as Draft' })
  await save.click()
  await expect.element(save).toBeEnabled()
  expect(get(workStore).ui.loading).toBe(false)
  expect(mocks.end).toHaveBeenCalledOnce()
  await save.click()
  expect(mocks.goToFiles).toHaveBeenCalledOnce()
  expect(mocks.end).toHaveBeenCalledTimes(2)
})

test('edit errors release loading and retain the form', async () => {
  mocks.updateContentFiles.mockRejectedValueOnce(new Error('offline'))
  const data = {
    id: 'work',
    metadata: { type: 'works', name: 'Test work', contentType: 'Lyrics' },
    existingFiles: { works: [], 'preview-files': [] },
  } as unknown as ComponentProps<typeof EditPage>['data']
  const screen = await render(EditPage, { data })
  const save = screen.getByRole('button', { name: 'Save as Draft' })
  await save.click()
  await expect.element(save).toBeEnabled()
  expect(get(workStore).ui.loading).toBe(false)
  expect(get(workStore).title).toBe('Test work')
  expect(mocks.end).toHaveBeenCalledOnce()
})

test('Lyrics has one text upload and no Script-only fields', async () => {
  const screen = await render(UploadWorkStep, { currentStep: 1 })
  await expect.element(screen.getByRole('heading', { name: 'Your Text File' })).toBeVisible()
  await expect.element(screen.getByPlaceholder('Description')).not.toBeInTheDocument()
  await expect.element(screen.getByText('Genre', { exact: true })).not.toBeInTheDocument()
  await expect.element(screen.getByRole('heading', { name: 'Your sample content' })).not.toBeInTheDocument()
})

test('Script has distinct sample and creative work uploads', async () => {
  workStore.setContentType('Script')
  const screen = await render(UploadWorkStep, { currentStep: 1 })
  await expect.element(screen.getByRole('heading', { name: 'Your sample content' })).toBeVisible()
  await expect.element(screen.getByRole('heading', { name: 'Your Creative Work' })).toBeVisible()
  await expect.element(screen.getByPlaceholder('Description')).toBeVisible()
})

test('confirmation places the author below the title and expands Lyrics', async () => {
  workStore.addAuthor('Test Author')
  const screen = await render(ConfirmWorkStep, { currentStep: 3, onFormSubmit: vi.fn() })
  await expect.element(screen.getByText(/Lyrics by Test Author/)).toBeVisible()
  await screen.getByRole('button', { name: 'Read full sample' }).click()
  await expect.element(screen.getByRole('button', { name: 'Read less' })).toBeVisible()
})

test('successful publishing ends the upload session exactly once', async () => {
  workStore.appendMediaFiles('works', [new File(['lyrics'], 'lyrics.txt')])
  workStore.setRightsConfirmed(true)
  workStore.setLicenseTypePrice('single-use', '25')
  workStore.setAgreedToFee(true)
  const screen = await render(CreatePage)
  await screen.getByRole('button', { name: 'Save and Continue' }).click()
  await screen.getByRole('button', { name: 'Save and Continue' }).click()
  await screen.getByRole('button', { name: 'Save and Publish' }).click()
  await expect.element(screen.getByRole('button', { name: 'Save and Publish' })).toBeEnabled()
  expect(mocks.saveMetadata).toHaveBeenCalledOnce()
  expect(mocks.updateContentMetadata).toHaveBeenCalledWith(
    expect.objectContaining({
      metadata: expect.objectContaining({ sample_file_name: 'sample.txt', preview_files_name: ['sample.txt'] }),
    }),
  )
  expect(mocks.end).toHaveBeenCalledOnce()
  expect(get(workStore).ui.loading).toBe(false)
})

test('typing an author and leaving the field preserves the author', async () => {
  const screen = await render(UploadWorkStep, { currentStep: 1 })
  await screen.getByRole('textbox', { name: 'Author', exact: true }).fill('New Author')
  await screen.getByRole('heading', { name: 'Creative Works', exact: true }).click()
  expect(get(workStore).authors).toEqual(['New Author'])
})

test('legacy unsupported licenses do not prevent continuing with supported licenses', () => {
  workStore.setLicenseTypeEnabled('ai-training', true)
  workStore.setLicenseTypePrice('single-use', '25')
  workStore.setAgreedToFee(true)
  expect(get(isFormValid)).toBe(true)
})

test('a new Script publishes only its designated sample file to preview storage', async () => {
  workStore.setContentType('Script')
  const script = new File(['private full script'], 'full.pdf')
  const sample = new File(['public excerpt'], 'excerpt.pdf')
  workStore.appendMediaFiles('works', [script])
  workStore.appendMediaFiles('preview-files', [sample])
  const screen = await render(CreatePage)
  await screen.getByRole('button', { name: 'Save as Draft' }).click()
  expect(mocks.uploadPreviewFiles).toHaveBeenCalledWith(
    expect.objectContaining({ uploads: [{ file: sample, name: 'sample' }] }),
  )
  expect(mocks.saveDraftContent).toHaveBeenCalledWith(
    expect.objectContaining({ uploads: [{ file: script, name: 'work_1' }] }),
  )
  expect(mocks.updateContentMetadata).toHaveBeenCalledWith(
    expect.objectContaining({ metadata: expect.objectContaining({ sample_file_name: 'sample.pdf' }) }),
  )
})

test('failed Lyrics preview upload does not leave a sample URL in metadata', async () => {
  workStore.appendMediaFiles('works', [new File(['lyrics'], 'lyrics.txt')])
  mocks.uploadPreviewFiles.mockRejectedValueOnce(new Error('preview offline'))
  const screen = await render(CreatePage)
  await screen.getByRole('button', { name: 'Save as Draft' }).click()
  expect(mocks.updateContentMetadata).toHaveBeenCalledWith(
    expect.objectContaining({ metadata: expect.objectContaining({ sample_file_name: '', preview_files_name: [] }) }),
  )
  expect(get(workStore).ui.loading).toBe(false)
})

test('editing Lyrics preserves its existing public sample when the original is unchanged', async () => {
  const data = {
    id: 'work',
    metadata: {
      type: 'works',
      name: 'Lyrics',
      contentType: 'Lyrics',
      sample_file_name: 'sample.txt',
      files_name: ['work_1.txt'],
    },
    existingFiles: {
      works: [{ id: 'original', name: 'work_1.txt', url: 'https://private/work_1.txt', key: 'original-key' }],
      'preview-files': [{ id: 'sample', name: 'sample.txt', url: 'https://preview/sample.txt', key: 'sample-key' }],
    },
  } as unknown as ComponentProps<typeof EditPage>['data']
  const screen = await render(EditPage, { data })
  await screen.getByRole('button', { name: 'Save as Draft' }).click()
  expect(mocks.uploadPreviewFiles).not.toHaveBeenCalled()
  expect(mocks.removeContentFile).not.toHaveBeenCalled()
  expect(mocks.updateContentMetadata).toHaveBeenCalledWith(
    expect.objectContaining({ metadata: expect.objectContaining({ sample_file_name: 'sample.txt' }) }),
  )
})

test('replacing the Lyrics original replaces the public sample and its metadata', async () => {
  const data = {
    id: 'work',
    metadata: {
      type: 'works',
      name: 'Lyrics',
      contentType: 'Lyrics',
      sample_file_name: 'sample.txt',
      files_name: ['work_1.txt'],
    },
    existingFiles: {
      works: [{ id: 'original', name: 'work_1.txt', url: 'https://private/work_1.txt', key: 'original-key' }],
      'preview-files': [{ id: 'sample', name: 'sample.txt', url: 'https://preview/sample.txt', key: 'sample-key' }],
    },
  } as unknown as ComponentProps<typeof EditPage>['data']
  const screen = await render(EditPage, { data })
  const replacement = new File(['replacement lyrics'], 'new.pdf')
  workStore.removeExistingFile('works', 0)
  workStore.appendMediaFiles('works', [replacement])
  await screen.getByRole('button', { name: 'Save as Draft' }).click()
  expect(mocks.updateContentFiles).toHaveBeenCalledWith(
    expect.objectContaining({ uploads: [{ file: replacement, name: 'work_1' }] }),
  )
  expect(mocks.removeContentFile).toHaveBeenCalledWith({ fileId: 'sample' })
  expect(mocks.uploadPreviewFiles).toHaveBeenCalledWith(
    expect.objectContaining({ uploads: [{ file: replacement, name: 'sample' }] }),
  )
  expect(mocks.updateContentMetadata).toHaveBeenCalledWith(
    expect.objectContaining({
      metadata: expect.objectContaining({ sample_file_name: 'sample.pdf', preview_files_name: ['sample.pdf'] }),
    }),
  )
})
