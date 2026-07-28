import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createImagePreview: vi.fn(),
  uploadFileToBucket: vi.fn(),
}))

vi.mock('$lib', () => ({
  authStore: {
    state: {
      accessToken: 'access-token',
    },
  },
}))

vi.mock('@repo/fe-services', () => ({
  r2BaseConfig: {
    defaultImageUrl: 'https://example.com/default.png',
  },
}))

vi.mock('./image-preview.service', () => ({
  createImagePreview: mocks.createImagePreview,
  isPreviewImage: (file: File) => {
    if (file.type.startsWith('image/')) return true
    const fileName = file.name ?? ''
    const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
    return ['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'].includes(extension)
  },
}))

vi.mock('./file-upload.service', () => ({
  default: mocks.uploadFileToBucket,
}))

import UploadService from './upload.service'
import { STATUS } from '../../routes/authed/likeness/constants/constants'

const createTrpcClient = () => {
  const createContentFileUploadUrl = vi
    .fn()
    .mockResolvedValueOnce({ url: 'original-url', key: 'original-key' })
    .mockResolvedValueOnce({ url: 'preview-url', key: 'preview-key' })
  const registerContentFile = vi.fn().mockResolvedValue({})

  const client = {
    contents: {
      registerContent: {
        mutate: vi.fn().mockResolvedValue({ id: 'content-id' }),
      },
      updateContentMetadata: {
        mutate: vi.fn().mockResolvedValue({}),
      },
      createContentFileUploadUrl: {
        mutate: createContentFileUploadUrl,
      },
      registerContentFile: {
        mutate: registerContentFile,
      },
      removeContentFile: {
        mutate: vi.fn().mockResolvedValue({ ok: true }),
      },
      getContentById: {
        query: vi.fn().mockResolvedValue({
          id: 'content-id',
          metadata: {
            profile: {
              fullLegalName: 'Jane Actor',
              stageName: 'J. A.',
              bio: 'Bio',
            },
            licensing: {
              licensePrices: {
                perpetual: 10,
                'single-use': 5,
              },
            },
          },
          files: [
            { id: 'file-1', key: 'content-key', bucket: 'content' },
            { id: 'file-2', key: 'preview-key', bucket: 'preview' },
          ],
        }),
      },
      uploadTokenMetadata: {
        mutate: vi.fn().mockResolvedValue({}),
      },
    },
  }

  return { client, createContentFileUploadUrl, registerContentFile }
}

describe('UploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forwards upload progress callbacks during content file uploads', async () => {
    const original = new File(['original'], 'image.jpg', { type: 'image/jpg' })
    const preview = new File(['preview'], 'image.jpg', { type: 'image/jpeg' })
    const { client } = createTrpcClient()
    mocks.createImagePreview.mockResolvedValue(preview)
    const onUploadProgress = vi.fn()

    mocks.uploadFileToBucket.mockImplementation(async (_file, _url, progress) => {
      progress?.(0.5)
      progress?.(1)
    })

    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.uploadContentFiles({
      contentId: 'content-id',
      uploads: [{ file: original, name: 'headshot_1' }],
      trpcClient: client as never,
      onUploadProgress,
    })

    expect(onUploadProgress).toHaveBeenCalled()
    expect(onUploadProgress.mock.calls.some((call) => call[0].phase === 'uploading')).toBe(true)
    expect(onUploadProgress.mock.calls.at(-1)?.[0]).toMatchObject({
      phase: 'uploading',
      overallProgress: 1,
    })
  })

  it('uploads an image preview to the preview bucket without registering it', async () => {
    const original = new File(['original'], 'image.jpg', { type: 'image/jpg' })
    const preview = new File(['preview'], 'image.jpg', { type: 'image/jpeg' })
    const { client, createContentFileUploadUrl, registerContentFile } = createTrpcClient()
    mocks.createImagePreview.mockResolvedValue(preview)

    const transactionService = {
      mintWithPrices: vi.fn().mockResolvedValue('token-id'),
    }
    const service = new UploadService(transactionService as never)

    await expect(
      service.uploadContentFiles({
        contentId: 'content-id',
        uploads: [{ file: original, name: 'headshot_1' }],
        trpcClient: client as never,
      }),
    ).resolves.toEqual({ keys: ['original-key'] })

    expect(createContentFileUploadUrl).toHaveBeenNthCalledWith(1, {
      contentId: 'content-id',
      mimetype: 'image/jpg',
      bucket: 'content',
      filename: 'headshot_1',
      extension: 'jpg',
    })
    expect(createContentFileUploadUrl).toHaveBeenNthCalledWith(2, {
      contentId: 'content-id',
      mimetype: 'image/jpeg',
      filename: 'headshot_1',
      extension: 'jpg',
      bucket: 'preview',
    })
    expect(mocks.uploadFileToBucket).toHaveBeenNthCalledWith(2, preview, 'preview-url', expect.any(Function))
    expect(registerContentFile).toHaveBeenCalledWith({
      contentId: 'content-id',
      key: 'original-key',
      bucket: 'content',
      filename: 'headshot_1.jpg',
      mimetype: 'image/jpg',
      label: 'headshot_1.jpg',
    })
  })

  it('keeps the gif extension for gif previews', async () => {
    const original = new File(['original'], 'portrait.gif', { type: 'image/gif' })
    const preview = new File(['preview'], 'portrait.gif', { type: 'image/gif' })
    const { client, createContentFileUploadUrl } = createTrpcClient()
    mocks.createImagePreview.mockResolvedValue(preview)

    const transactionService = {
      mintWithPrices: vi.fn().mockResolvedValue('token-id'),
    }
    const service = new UploadService(transactionService as never)

    await service.uploadContentFiles({
      contentId: 'content-id',
      uploads: [{ file: original, name: 'headshot_1' }],
      trpcClient: client as never,
    })

    expect(createContentFileUploadUrl).toHaveBeenNthCalledWith(1, {
      contentId: 'content-id',
      mimetype: 'image/gif',
      bucket: 'content',
      filename: 'headshot_1',
      extension: 'gif',
    })
    expect(createContentFileUploadUrl).toHaveBeenNthCalledWith(2, {
      contentId: 'content-id',
      mimetype: 'image/gif',
      filename: 'headshot_1',
      extension: 'gif',
      bucket: 'preview',
    })
  })

  it('keeps the original upload successful when preview creation fails', async () => {
    const original = new File(['original'], 'image.png', { type: 'image/png' })
    const { client, createContentFileUploadUrl, registerContentFile } = createTrpcClient()
    const previewError = new Error('preview failed')
    mocks.createImagePreview.mockRejectedValue(previewError)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const transactionService = {
      mintWithPrices: vi.fn().mockResolvedValue('token-id'),
    }
    const service = new UploadService(transactionService as never)

    await expect(
      service.uploadContentFiles({
        contentId: 'content-id',
        uploads: [{ file: original, name: 'bodyshot_1' }],
        trpcClient: client as never,
      }),
    ).resolves.toEqual({ keys: ['original-key'] })

    expect(createContentFileUploadUrl).toHaveBeenCalledTimes(1)
    expect(mocks.uploadFileToBucket).toHaveBeenCalledTimes(1)
    expect(registerContentFile).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith('Failed to upload preview for image.png', previewError)
  })

  it('still reaches overall progress of 1 when preview creation fails', async () => {
    const original = new File(['original'], 'image.png', { type: 'image/png' })
    const { client } = createTrpcClient()
    mocks.createImagePreview.mockRejectedValue(new Error('preview failed'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onUploadProgress = vi.fn()

    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.uploadContentFiles({
      contentId: 'content-id',
      uploads: [{ file: original, name: 'bodyshot_1' }],
      trpcClient: client as never,
      onUploadProgress,
    })

    expect(onUploadProgress.mock.calls.at(-1)?.[0]).toMatchObject({
      phase: 'uploading',
      overallProgress: 1,
    })
  })

  it('saves a draft without minting a token', async () => {
    const original = new File(['original'], 'voice.mp3', { type: 'audio/mpeg' })
    const { client } = createTrpcClient()
    const transactionService = {
      mintWithPrices: vi.fn(),
    }
    const service = new UploadService(transactionService as never)

    await expect(
      service.saveDraftContent({
        uploads: [{ file: original, name: 'voice_1' }],
        metadata: { type: 'likeness' },
        trpcClient: client as never,
      }),
    ).resolves.toEqual({ contentId: 'content-id', keys: ['original-key'] })

    expect(transactionService.mintWithPrices).not.toHaveBeenCalled()
    expect(mocks.createImagePreview).not.toHaveBeenCalled()
    expect(client.contents.registerContent.mutate).toHaveBeenCalledWith({
      metadata: { type: 'likeness' },
    })
  })

  it('forwards withWatermark to createImagePreview', async () => {
    const original = new File(['original'], 'image.jpg', { type: 'image/jpeg' })
    const preview = new File(['preview'], 'image.jpg', { type: 'image/jpeg' })
    const { client } = createTrpcClient()
    mocks.createImagePreview.mockResolvedValue(preview)

    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.saveDraftContent({
      uploads: [{ file: original, name: 'location' }],
      metadata: { type: 'location' },
      trpcClient: client as never,
      withWatermark: false,
    })

    expect(mocks.createImagePreview).toHaveBeenCalledWith(original, { withWatermark: false })
  })

  it('forwards tags to registerContent when saving a draft', async () => {
    const original = new File(['original'], 'location.jpg', { type: 'image/jpeg' })
    const { client } = createTrpcClient()
    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.saveDraftContent({
      uploads: [{ file: original, name: 'location' }],
      metadata: { type: 'location', name: 'Citi Field' },
      tags: ['Baseball', 'Queens'],
      trpcClient: client as never,
    })

    expect(client.contents.registerContent.mutate).toHaveBeenCalledWith({
      metadata: { type: 'location', name: 'Citi Field' },
      tags: ['Baseball', 'Queens'],
    })
  })

  it('updates existing content files by removing deleted files and uploading new files', async () => {
    const newFile = new File(['original'], 'headshot.png', { type: 'image/png' })
    const { client, createContentFileUploadUrl, registerContentFile } = createTrpcClient()
    mocks.createImagePreview.mockResolvedValue(new File(['preview'], 'headshot.png', { type: 'image/jpeg' }))
    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await expect(
      service.updateContentFiles({
        contentId: 'content-id',
        currentFiles: [
          { id: 'kept-file-id', key: 'kept-key' },
          { id: 'removed-file-id', key: 'removed-key' },
        ],
        keptFileIds: new Set(['kept-file-id']),
        uploads: [{ file: newFile, name: 'headshot_2' }],
        trpcClient: client as never,
      }),
    ).resolves.toEqual({ keys: ['kept-key', 'original-key'] })

    expect(client.contents.removeContentFile.mutate).toHaveBeenCalledWith({ fileId: 'removed-file-id' })
    expect(createContentFileUploadUrl).toHaveBeenCalledTimes(1)
    expect(registerContentFile).toHaveBeenCalledWith({
      contentId: 'content-id',
      key: 'original-key',
      bucket: 'content',
      filename: 'headshot_2.png',
      mimetype: 'image/png',
      label: 'headshot_2.png',
    })
    expect(mocks.createImagePreview).not.toHaveBeenCalled()
  })

  it('mints content with the current access token and requested prices', async () => {
    const transactionService = {
      mintWithPrices: vi.fn().mockResolvedValue('token-id'),
    }
    const service = new UploadService(transactionService as never)

    await expect(service.mintContent({ oneTimePrice: 5 })).resolves.toBe('token-id')

    expect(transactionService.mintWithPrices).toHaveBeenCalledWith('access-token', { oneTimePrice: 5 })
  })

  it('finalizes content as active with metadata and token id', async () => {
    const { client } = createTrpcClient()
    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.finalizeContent({
      contentId: 'content-id',
      tokenId: 'token-id',
      metadata: { type: 'likeness' },
      trpcClient: client as never,
    })

    expect(client.contents.updateContentMetadata.mutate).toHaveBeenCalledWith({
      contentId: 'content-id',
      metadata: { type: 'likeness' },
      tokenId: 'token-id',
      status: STATUS.ACTIVE,
    })
  })

  it('updates content metadata with optional status and token id', async () => {
    const { client } = createTrpcClient()
    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.updateContentMetadata({
      contentId: 'content-id',
      tokenId: 'token-id',
      status: STATUS.DRAFT,
      metadata: { type: 'likeness' },
      trpcClient: client as never,
    })

    expect(client.contents.updateContentMetadata.mutate).toHaveBeenCalledWith({
      contentId: 'content-id',
      metadata: { type: 'likeness' },
      tokenId: 'token-id',
      status: STATUS.DRAFT,
    })
  })

  it('passes tags to updateContentMetadata when provided', async () => {
    const { client } = createTrpcClient()
    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.updateContentMetadata({
      contentId: 'content-id',
      metadata: { type: 'location', name: 'Citi Field' },
      tags: ['Baseball'],
      trpcClient: client as never,
    })

    expect(client.contents.updateContentMetadata.mutate).toHaveBeenCalledWith({
      contentId: 'content-id',
      metadata: { type: 'location', name: 'Citi Field' },
      tags: ['Baseball'],
    })
  })

  it('updates content status without sending metadata', async () => {
    const { client } = createTrpcClient()
    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.updateContentMetadata({
      contentId: 'content-id',
      status: STATUS.SALE_DISABLED,
      trpcClient: client as never,
    })

    expect(client.contents.updateContentMetadata.mutate).toHaveBeenCalledWith({
      contentId: 'content-id',
      status: STATUS.SALE_DISABLED,
    })
  })

  it('saves token metadata with the default image', async () => {
    const { client } = createTrpcClient()
    const service = new UploadService({ mintWithPrices: vi.fn() } as never)

    await service.saveMetadata({
      tokenId: 'token-id',
      title: 'Title',
      description: 'Description',
      keys: ['content-key'],
      trpcClient: client as never,
    })

    expect(client.contents.uploadTokenMetadata.mutate).toHaveBeenCalledWith({
      tokenId: 'token-id',
      metadata: {
        title: 'Title',
        description: 'Description',
        keys: ['content-key'],
        image: 'https://example.com/default.png',
      },
    })
  })

  describe('uploadLocationPreviewImage', () => {
    it('uploads preview file and registers it with the preview bucket', async () => {
      const file = new File(['data'], 'photo.png', { type: 'image/png' })
      const { client, createContentFileUploadUrl, registerContentFile } = createTrpcClient()
      const service = new UploadService({ mintWithPrices: vi.fn() } as never)

      await service.uploadLocationPreviewImage({
        contentId: 'content-id',
        file,
        filename: 'preview',
        trpcClient: client as never,
      })

      expect(createContentFileUploadUrl).toHaveBeenCalledWith({
        contentId: 'content-id',
        mimetype: 'image/png',
        bucket: 'preview',
        filename: 'preview',
        extension: 'png',
      })
      expect(mocks.uploadFileToBucket).toHaveBeenCalledWith(file, 'original-url', undefined)
      expect(registerContentFile).toHaveBeenCalledWith({
        contentId: 'content-id',
        key: 'original-key',
        bucket: 'preview',
        filename: 'preview.png',
        mimetype: 'image/png',
        label: 'preview.png',
      })
    })

    it('propagates upload errors', async () => {
      const file = new File(['data'], 'photo.png', { type: 'image/png' })
      const { client } = createTrpcClient()
      mocks.uploadFileToBucket.mockRejectedValueOnce(new Error('network'))
      const service = new UploadService({ mintWithPrices: vi.fn() } as never)

      await expect(
        service.uploadLocationPreviewImage({
          contentId: 'content-id',
          file,
          filename: 'preview',
          trpcClient: client as never,
        }),
      ).rejects.toThrow('network')
    })

    it('handles filename with existing extension without duplicating it', async () => {
      const file = new File(['data'], 'photo.gif', { type: 'image/gif' })
      const { client, createContentFileUploadUrl, registerContentFile } = createTrpcClient()
      const service = new UploadService({ mintWithPrices: vi.fn() } as never)

      await service.uploadLocationPreviewImage({
        contentId: 'content-id',
        file,
        filename: 'preview.gif',
        trpcClient: client as never,
      })

      expect(createContentFileUploadUrl).toHaveBeenCalledWith({
        contentId: 'content-id',
        mimetype: 'image/gif',
        bucket: 'preview',
        filename: 'preview',
        extension: 'gif',
      })
      expect(registerContentFile).toHaveBeenCalledWith({
        contentId: 'content-id',
        key: 'original-key',
        bucket: 'preview',
        filename: 'preview.gif',
        mimetype: 'image/gif',
        label: 'preview.gif',
      })
    })

    it('handles filename without extension', async () => {
      const file = new File(['data'], 'photo.webp', { type: 'image/webp' })
      const { client, registerContentFile } = createTrpcClient()
      const service = new UploadService({ mintWithPrices: vi.fn() } as never)

      await service.uploadLocationPreviewImage({
        contentId: 'content-id',
        file,
        filename: 'preview',
        trpcClient: client as never,
      })

      expect(registerContentFile).toHaveBeenCalledWith({
        contentId: 'content-id',
        key: 'original-key',
        bucket: 'preview',
        filename: 'preview.webp',
        mimetype: 'image/webp',
        label: 'preview.webp',
      })
    })

    it('registers basename only when the file has no extension', async () => {
      const file = new File(['data'], 'photo', { type: 'image/png' })
      const { client, createContentFileUploadUrl, registerContentFile } = createTrpcClient()
      const service = new UploadService({ mintWithPrices: vi.fn() } as never)

      await service.uploadLocationPreviewImage({
        contentId: 'content-id',
        file,
        filename: 'preview',
        trpcClient: client as never,
      })

      expect(createContentFileUploadUrl).toHaveBeenCalledWith({
        contentId: 'content-id',
        mimetype: 'image/png',
        bucket: 'preview',
        filename: 'preview',
        extension: '',
      })
      expect(registerContentFile).toHaveBeenCalledWith({
        contentId: 'content-id',
        key: 'original-key',
        bucket: 'preview',
        filename: 'preview',
        mimetype: 'image/png',
        label: 'preview',
      })
    })
  })
})
