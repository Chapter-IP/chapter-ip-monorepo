import { beforeEach, describe, expect, it, vi } from 'vitest'
import { removeWorkPreviews, uploadWorkPreviews } from './work-previews'

const notify = vi.hoisted(() => vi.fn())
vi.mock('@repo/ui-components', () => ({ notify, ToastType: { FAIL: 'fail' } }))

type PreviewClient = Parameters<typeof uploadWorkPreviews>[0]['trpcClient']
const removeFile = vi.fn()
const client = { contents: { removeContentFile: { mutate: removeFile } } } as unknown as PreviewClient

beforeEach(() => {
  vi.resetAllMocks()
})

describe('creative work preview persistence', () => {
  it('keeps metadata for successful samples when another upload fails', async () => {
    const uploadPreviewFiles = vi
      .fn()
      .mockResolvedValueOnce({ keys: ['first'] })
      .mockRejectedValueOnce(new Error('offline'))
    const uploaded = await uploadWorkPreviews({
      uploadService: { uploadPreviewFiles },
      trpcClient: client,
      contentId: 'work',
      uploads: [
        { name: 'preview-1', file: new File(['sample'], 'first.pdf') },
        { name: 'preview-2', file: new File(['sample'], 'second.txt') },
      ],
    })
    expect(uploaded).toEqual(['preview-1.pdf'])
    expect(notify).toHaveBeenCalledOnce()
  })

  it('does not put a failed sample in metadata', async () => {
    const uploadPreviewFiles = vi.fn().mockRejectedValue(new Error('offline'))
    expect(
      await uploadWorkPreviews({
        uploadService: { uploadPreviewFiles },
        trpcClient: client,
        contentId: 'work',
        uploads: [{ name: 'preview-1', file: new File(['sample'], 'sample.pdf') }],
      }),
    ).toEqual([])
  })

  it('removes discarded samples independently of a retained cover image', async () => {
    removeFile.mockResolvedValue({ ok: true })
    const onRemoved = vi.fn()
    await removeWorkPreviews({
      trpcClient: client,
      initialFileIds: ['sample-1', 'sample-2'],
      keptFileIds: new Set(['sample-2']),
      onRemoved,
    })
    expect(removeFile).toHaveBeenCalledExactlyOnceWith({ fileId: 'sample-1' })
    expect(onRemoved).toHaveBeenCalledExactlyOnceWith('sample-1')
  })

  it('propagates deletion failures so a save cannot silently orphan a sample', async () => {
    removeFile.mockRejectedValue(new Error('offline'))
    const onRemoved = vi.fn()
    await expect(
      removeWorkPreviews({ trpcClient: client, initialFileIds: ['sample-1'], keptFileIds: new Set(), onRemoved }),
    ).rejects.toThrow('offline')
    expect(onRemoved).not.toHaveBeenCalled()
  })
})
