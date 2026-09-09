import { beforeEach, describe, expect, it, vi } from 'vitest'
import { removeWorkPreviews, uploadWorkPreviews, syncWorkSample, getWorkSampleSource } from './work-previews'

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

describe('canonical work samples', () => {
  it('uploads the original Lyrics bytes as sample.txt', async () => {
    const file = new File(['full lyrics'], 'irregardless.txt', { type: 'text/plain' })
    const uploadPreviewFiles = vi.fn().mockResolvedValue({ keys: ['sample-key'] })
    const names = await syncWorkSample({
      source: file,
      uploadService: { uploadPreviewFiles },
      trpcClient: client,
      contentId: 'lyrics',
    })
    expect(names).toEqual(['sample.txt'])
    expect(uploadPreviewFiles).toHaveBeenCalledWith(expect.objectContaining({ uploads: [{ file, name: 'sample' }] }))
  })

  it('selects the dedicated Script sample instead of publishing the full work', () => {
    const fullWork = new File(['private script'], 'full.pdf')
    const sample = new File(['public excerpt'], 'excerpt.pdf')
    expect(
      getWorkSampleSource({
        contentType: 'Script',
        files: { works: [fullWork], 'preview-files': [sample] },
        existingFiles: { works: [], 'preview-files': [] },
      }),
    ).toBe(sample)
    expect(
      getWorkSampleSource({
        contentType: 'Lyrics',
        files: { works: [fullWork], 'preview-files': [] },
        existingFiles: { works: [], 'preview-files': [] },
      }),
    ).toBe(fullWork)
  })

  it('keeps a canonical sample on metadata-only edits', async () => {
    const uploadPreviewFiles = vi.fn()
    const preview = { id: 'sample', name: 'sample.txt', url: 'https://preview/sample.txt' }
    expect(
      await syncWorkSample({
        source: { id: 'original', name: 'work_1.txt', url: 'https://private/work_1.txt' },
        existingPreviewFiles: [preview],
        preserveExistingSample: true,
        uploadService: { uploadPreviewFiles },
        trpcClient: client,
        contentId: 'lyrics',
      }),
    ).toEqual(['sample.txt'])
    expect(uploadPreviewFiles).not.toHaveBeenCalled()
    expect(removeFile).not.toHaveBeenCalled()
  })

  it('replaces the old public sample when its extension changes', async () => {
    removeFile.mockResolvedValue({ ok: true })
    const uploadPreviewFiles = vi.fn().mockResolvedValue({ keys: ['sample-key'] })
    const onRemoved = vi.fn()
    expect(
      await syncWorkSample({
        source: new File(['new'], 'new.pdf'),
        existingPreviewFiles: [{ id: 'old', name: 'sample.txt', url: 'https://preview/sample.txt' }],
        onRemoved,
        uploadService: { uploadPreviewFiles },
        trpcClient: client,
        contentId: 'lyrics',
      }),
    ).toEqual(['sample.pdf'])
    expect(removeFile).toHaveBeenCalledWith({ fileId: 'old' })
    expect(onRemoved).toHaveBeenCalledWith('old')
  })

  it('migrates a legacy sample to the default name when editing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('legacy excerpt', { headers: { 'Content-Type': 'text/plain' } })),
    )
    const uploadPreviewFiles = vi.fn().mockResolvedValue({ keys: ['sample-key'] })
    const legacy = { id: 'legacy', name: 'preview_file_1.txt', url: 'https://preview/preview_file_1.txt' }
    try {
      expect(
        await syncWorkSample({
          source: legacy,
          existingPreviewFiles: [legacy],
          preserveExistingSample: true,
          uploadService: { uploadPreviewFiles },
          trpcClient: client,
          contentId: 'script',
        }),
      ).toEqual(['sample.txt'])
      const file = uploadPreviewFiles.mock.calls[0][0].uploads[0].file as File
      expect(await file.text()).toBe('legacy excerpt')
      expect(removeFile).toHaveBeenCalledWith({ fileId: 'legacy' })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
