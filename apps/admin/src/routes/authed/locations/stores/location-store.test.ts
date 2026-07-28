import { describe, expect, it, vi } from 'vitest'
import { loadExistingFiles } from './location-store'
import { appendOriginalExtension, uploadPreviewIfNeeded } from '../utils'

type LoadExistingFilesContent = Parameters<typeof loadExistingFiles>[0]
type LoadExistingFilesClient = Parameters<typeof loadExistingFiles>[1]
type Query = LoadExistingFilesClient['contents']['getContentAllFilesLink']['query']

const createTrpcClient = (query?: Query) =>
  ({
    contents: {
      getContentAllFilesLink: { query: query ?? vi.fn(async () => ({ files: [] })) },
    },
  }) as unknown as LoadExistingFilesClient

describe('loadExistingFiles', () => {
  it('skips query and returns empty results when content id is missing', async () => {
    const query = vi.fn()
    const trpcClient = createTrpcClient(query)
    const content: LoadExistingFilesContent = { id: '' }

    const result = await loadExistingFiles(content, trpcClient)

    expect(result).toEqual({ files: { locations: [] }, allFiles: { locations: [] }, previewUrl: null })
    expect(query).not.toHaveBeenCalled()
  })

  it('treats a null files response as an empty list', async () => {
    const trpcClient = createTrpcClient(vi.fn(async () => ({ files: null })))
    const content: LoadExistingFilesContent = { id: 'content-1' }

    const result = await loadExistingFiles(content, trpcClient)

    expect(result).toEqual({ files: { locations: [] }, allFiles: { locations: [] }, previewUrl: null })
  })

  it('includes all non-preview files in allFiles when no files_name filter is set', async () => {
    const query = vi.fn(async () => ({
      files: [
        { id: 'f1', label: 'photo_1', url: 'https://r2.example/f1', key: 'k1', bucket: 'content' },
        { id: 'f2', label: 'photo_2', url: 'https://r2.example/f2', key: 'k2', bucket: 'content' },
      ],
    }))
    const trpcClient = createTrpcClient(query)

    const result = await loadExistingFiles({ id: 'content-1' }, trpcClient)

    expect(result.files.locations).toHaveLength(2)
    expect(result.allFiles.locations).toHaveLength(2)
  })

  it('filters files by files_name allow-list', async () => {
    const query = vi.fn(async () => ({
      files: [
        { id: 'f1', label: 'photo_1', url: 'https://r2.example/f1', key: 'k1', bucket: 'content' },
        { id: 'f2', label: 'photo_2', url: 'https://r2.example/f2', key: 'k2', bucket: 'content' },
        { id: 'f3', label: 'photo_3', url: 'https://r2.example/f3', key: 'k3', bucket: 'content' },
      ],
    }))
    const trpcClient = createTrpcClient(query)
    const content: LoadExistingFilesContent = {
      id: 'content-1',
      metadata: { files_name: ['photo_1', 'photo_3'] },
    }

    const result = await loadExistingFiles(content, trpcClient)

    expect(result.files.locations.map((f) => f.name)).toEqual(['photo_1', 'photo_3'])
    expect(result.allFiles.locations.map((f) => f.name)).toEqual(['photo_1', 'photo_2', 'photo_3'])
  })

  it('returns empty files but full allFiles when no files match the allow-list', async () => {
    const query = vi.fn(async () => ({
      files: [{ id: 'f1', label: 'photo_1', url: 'https://r2.example/f1', key: 'k1', bucket: 'content' }],
    }))
    const trpcClient = createTrpcClient(query)
    const content: LoadExistingFilesContent = {
      id: 'content-1',
      metadata: { files_name: ['nonexistent'] },
    }

    const result = await loadExistingFiles(content, trpcClient)

    expect(result.files.locations).toHaveLength(0)
    expect(result.allFiles.locations).toHaveLength(1)
  })

  it('extracts previewUrl from files with preview bucket', async () => {
    const query = vi.fn(async () => ({
      files: [
        { id: 'preview-1', label: 'preview', url: 'https://r2.example/preview.jpg', key: 'pk', bucket: 'preview' },
        { id: 'f1', label: 'photo_1', url: 'https://r2.example/f1', key: 'k1', bucket: 'content' },
      ],
    }))
    const trpcClient = createTrpcClient(query)

    const result = await loadExistingFiles({ id: 'content-1' }, trpcClient)

    expect(result.previewUrl).toBe('https://r2.example/preview.jpg')
    expect(result.files.locations).toHaveLength(1)
    expect(result.allFiles.locations).toHaveLength(1)
  })

  it('extracts previewUrl from preview bucket', async () => {
    const query = vi.fn(async () => ({
      files: [{ id: 'p1', label: 'thumb', url: 'https://r2.example/thumb.webp', key: 'pk', bucket: 'preview' }],
    }))
    const trpcClient = createTrpcClient(query)

    const result = await loadExistingFiles({ id: 'content-1' }, trpcClient)

    expect(result.previewUrl).toBe('https://r2.example/thumb.webp')
    expect(result.allFiles.locations).toHaveLength(0)
  })

  it('returns null previewUrl when no preview bucket is present', async () => {
    const query = vi.fn(async () => ({
      files: [{ id: 'f1', label: 'photo_1', url: 'https://r2.example/f1', key: 'k1', bucket: 'content' }],
    }))
    const trpcClient = createTrpcClient(query)

    const result = await loadExistingFiles({ id: 'content-1' }, trpcClient)

    expect(result.previewUrl).toBeNull()
  })

  it('returns independent object copies in files and allFiles', async () => {
    const query = vi.fn(async () => ({
      files: [{ id: 'f1', label: 'photo_1', url: 'https://r2.example/f1', key: 'k1', bucket: 'content' }],
    }))
    const trpcClient = createTrpcClient(query)

    const result = await loadExistingFiles({ id: 'content-1' }, trpcClient)

    result.files.locations[0].name = 'mutated'
    expect(result.allFiles.locations[0].name).toBe('photo_1')
  })

  it('forwards contentId to the query', async () => {
    const query = vi.fn(async () => ({ files: [] }))
    const trpcClient = createTrpcClient(query)

    await loadExistingFiles({ id: 'content-42' }, trpcClient)

    expect(query).toHaveBeenCalledWith({ contentId: 'content-42' })
  })
})

describe('uploadPreviewIfNeeded', () => {
  it('delegates to uploadService.uploadLocationPreviewImage when previewImage is provided', async () => {
    const previewImage = new File(['bytes'], 'preview.jpg', { type: 'image/jpeg' })
    const uploadService = { uploadLocationPreviewImage: vi.fn().mockResolvedValue(undefined) }
    const trpcClient = {} as never

    await uploadPreviewIfNeeded({
      previewImage,
      contentId: 'content-1',
      uploadService: uploadService as never,
      trpcClient,
    })

    expect(uploadService.uploadLocationPreviewImage).toHaveBeenCalledWith({
      contentId: 'content-1',
      file: previewImage,
      filename: 'preview',
      trpcClient,
    })
  })

  it('does nothing when previewImage is null', async () => {
    const uploadService = { uploadLocationPreviewImage: vi.fn() }

    await uploadPreviewIfNeeded({
      previewImage: null,
      contentId: 'content-1',
      uploadService: uploadService as never,
      trpcClient: {} as never,
    })

    expect(uploadService.uploadLocationPreviewImage).not.toHaveBeenCalled()
  })

  it('propagates errors from uploadService.uploadLocationPreviewImage', async () => {
    const uploadService = {
      uploadLocationPreviewImage: vi.fn().mockRejectedValue(new Error('network failure')),
    }

    await expect(
      uploadPreviewIfNeeded({
        previewImage: new File(['bytes'], 'preview.jpg', { type: 'image/jpeg' }),
        contentId: 'content-1',
        uploadService: uploadService as never,
        trpcClient: {} as never,
      }),
    ).rejects.toThrow('network failure')
  })
})

describe('appendOriginalExtension', () => {
  it('appends the file extension to the upload name', () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' })
    expect(appendOriginalExtension('location_1', file)).toBe('location_1.png')
  })

  it('treats the bare filename as an extension when no dot is present', () => {
    const file = new File(['data'], 'noext', { type: 'application/octet-stream' })
    expect(appendOriginalExtension('location_1', file)).toBe('location_1')
  })
})
