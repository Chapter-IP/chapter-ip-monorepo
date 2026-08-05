import { createClient, type TRPCClient, type AppRouter } from '@repo/trpc/client'
import { type ContentPrices } from '@repo/content-types/content'
import { authStore } from '$lib'
import BlockchainService from './blockchain.service'
import uploadFileToBucket from './file-upload.service'
import { createImagePreview, isPreviewImage } from './image-preview.service'
import { STATUS, type StatusValue } from '../../routes/authed/likeness/constants/constants'

import { r2BaseConfig } from '@repo/fe-services'

export type NamedUpload = {
  file: File
  name: string
}

export type UploadPhase = 'uploading' | 'minting' | 'finalizing' | 'saving-metadata' | 'updating-prices'

export type UploadProgressEvent = {
  fileIndex?: number
  fileCount?: number
  fileName?: string
  progress?: number
  overallProgress: number
  phase: UploadPhase
  pendingFiles?: { id: string; label: string }[]
}

export type OnUploadProgress = (event: UploadProgressEvent) => void

type ContentFileReference = {
  id: string
  key: string
}
type UpdateContentMetadataInput = Parameters<TRPCClient<AppRouter>['contents']['updateContentMetadata']['mutate']>[0]

async function registerContentFile({
  contentId,
  key,
  bucket,
  filename,
  mimetype,
  trpcClient,
}: {
  contentId: string
  key: string
  bucket: 'content' | 'preview'
  filename: string
  mimetype: string
  trpcClient: TRPCClient<AppRouter>
}): Promise<void> {
  const ext = filename.includes('.') ? filename.split('.').pop() || '' : ''
  const baseName = ext ? filename.slice(0, filename.lastIndexOf('.')) : filename
  const registeredName = ext ? `${baseName}.${ext}` : baseName

  await trpcClient.contents.registerContentFile.mutate({
    contentId,
    key,
    bucket,
    filename: registeredName,
    mimetype,
    label: registeredName,
  })
}

async function uploadPreviewFile({
  contentId,
  file,
  trpcClient,
  onProgress,
  filename,
}: {
  contentId: string
  file: File
  filename?: string
  trpcClient: TRPCClient<AppRouter>
  onProgress?: (progress: number) => void
}): Promise<string> {
  const lastDot = file.name.lastIndexOf('.')

  const originalName = lastDot === -1 ? file.name : file.name.slice(0, lastDot)

  const ext = lastDot === -1 ? '' : file.name.slice(lastDot + 1)
  const { url, key } = await trpcClient.contents.createContentFileUploadUrl.mutate({
    contentId,
    mimetype: file.type,
    bucket: 'preview',
    filename: filename || originalName,
    extension: ext,
  })
  await uploadFileToBucket(file, url, onProgress)
  return key
}

export default class UploadService {
  constructor(private readonly blockchainService: BlockchainService) {}

  private countUploadUnits(uploads: NamedUpload[], includePreviews: boolean): number {
    let count = uploads.length
    if (includePreviews) {
      count += uploads.filter(({ file }) => isPreviewImage(file)).length
    }
    return count
  }

  async registerDraftContent({
    metadata,
    tags,
    trpcClient,
  }: {
    metadata: Record<string, unknown>
    tags?: string[]
    trpcClient: TRPCClient<AppRouter>
  }): Promise<{ contentId: string }> {
    const { id } = await trpcClient.contents.registerContent.mutate({
      metadata,
      ...(tags !== undefined ? { tags } : {}),
    } as Parameters<TRPCClient<AppRouter>['contents']['registerContent']['mutate']>[0])

    return { contentId: id }
  }

  async uploadContentFiles({
    contentId,
    uploads,
    trpcClient,
    includePreviews = true,
    withWatermark = true,
    onUploadProgress,
  }: {
    contentId: string
    uploads: NamedUpload[]
    trpcClient: TRPCClient<AppRouter>
    includePreviews?: boolean
    withWatermark?: boolean
    onUploadProgress?: OnUploadProgress
  }): Promise<{ keys: string[] }> {
    const keys: string[] = []
    const totalUnits = this.countUploadUnits(uploads, includePreviews)
    let completedUnits = 0

    const reportProgress = (fileName: string, fileProgress: number) => {
      onUploadProgress?.({
        fileIndex: completedUnits,
        fileCount: totalUnits,
        fileName,
        progress: fileProgress,
        overallProgress: totalUnits > 0 ? (completedUnits + fileProgress) / totalUnits : 1,
        phase: 'uploading',
      })
    }

    const reportFileComplete = (fileName: string) => {
      onUploadProgress?.({
        fileIndex: completedUnits - 1,
        fileCount: totalUnits,
        fileName,
        progress: 1,
        overallProgress: totalUnits > 0 ? completedUnits / totalUnits : 1,
        phase: 'uploading',
      })
    }

    for (const { file, name } of uploads) {
      const ext = file.name.split('.').pop() || ''
      const registeredName = ext ? `${name}.${ext}` : name

      const { url, key } = await trpcClient.contents.createContentFileUploadUrl.mutate({
        contentId,
        mimetype: file.type,
        bucket: 'content',
        filename: name,
        extension: ext,
      })
      keys.push(key)
      await uploadFileToBucket(file, url, (progress) => reportProgress(name, progress))
      completedUnits++
      reportFileComplete(name)

      await registerContentFile({
        contentId,
        key,
        bucket: 'content',
        filename: registeredName,
        mimetype: file.type,
        trpcClient,
      })

      if (includePreviews && isPreviewImage(file)) {
        const previewId = `${name} (preview)`
        try {
          const preview = await createImagePreview(file, { withWatermark })
          await uploadPreviewFile({
            contentId,
            file: preview,
            filename: name,
            trpcClient,
            onProgress: (progress) => reportProgress(previewId, progress),
          })
          completedUnits++
          reportFileComplete(previewId)
        } catch (error) {
          console.error(`Failed to upload preview for ${file.name}`, error)
          completedUnits++
          reportFileComplete(previewId)
        }
      }
    }

    return { keys }
  }

  async updateContentFiles({
    contentId,
    currentFiles,
    keptFileIds,
    uploads,
    trpcClient,
    includePreviews = false,
    withWatermark = true,
    onUploadProgress,
  }: {
    contentId: string
    currentFiles: ContentFileReference[]
    keptFileIds: Set<string>
    uploads: NamedUpload[]
    trpcClient: TRPCClient<AppRouter>
    includePreviews?: boolean
    withWatermark?: boolean
    onUploadProgress?: OnUploadProgress
  }): Promise<{ keys: string[] }> {
    const keys = currentFiles.filter((file) => keptFileIds.has(file.id)).map((file) => file.key)

    for (const file of currentFiles) {
      if (!keptFileIds.has(file.id)) {
        await trpcClient.contents.removeContentFile.mutate({ fileId: file.id })
      }
    }

    const uploaded = await this.uploadContentFiles({
      contentId,
      uploads,
      trpcClient,
      includePreviews,
      withWatermark,
      onUploadProgress,
    })

    return { keys: [...keys, ...uploaded.keys] }
  }

  async saveDraftContent({
    uploads,
    metadata,
    tags,
    trpcClient,
    includePreviews = true,
    withWatermark = true,
    onUploadProgress,
  }: {
    uploads: NamedUpload[]
    metadata: Record<string, unknown>
    tags?: string[]
    trpcClient: TRPCClient<AppRouter>
    includePreviews?: boolean
    withWatermark?: boolean
    onUploadProgress?: OnUploadProgress
  }): Promise<{ contentId: string; keys: string[] }> {
    const { contentId } = await this.registerDraftContent({ metadata, tags, trpcClient })
    const { keys } = await this.uploadContentFiles({
      contentId,
      uploads,
      trpcClient,
      includePreviews,
      withWatermark,
      onUploadProgress,
    })

    return { contentId, keys }
  }

  async mintContent({ oneTimePrice, lifetimePrice }: ContentPrices): Promise<string> {
    return await this.blockchainService.mintWithPrices({
      oneTimePrice,
      lifetimePrice,
    })
  }

  async updateContentPrices({ tokenId, prices }: { tokenId: string; prices: ContentPrices }): Promise<void> {
    await this.blockchainService.updateContentPrices(tokenId, prices)
  }

  async finalizeContent({
    contentId,
    tokenId,
    metadata,
    tags,
    trpcClient,
  }: {
    contentId: string
    tokenId: string
    metadata: Record<string, unknown>
    tags?: string[]
    trpcClient: TRPCClient<AppRouter>
  }): Promise<void> {
    await this.updateContentMetadata({
      contentId,
      metadata,
      tags,
      tokenId,
      status: STATUS.ACTIVE,
      trpcClient,
    })
  }

  async updateContentMetadata({
    contentId,
    tokenId,
    status,
    metadata,
    tags,
    trpcClient,
  }: {
    contentId: string
    tokenId?: string
    status?: StatusValue
    metadata?: UpdateContentMetadataInput['metadata']
    tags?: string[]
    trpcClient: TRPCClient<AppRouter>
  }): Promise<void> {
    const input = {
      contentId,
      ...(metadata !== undefined ? { metadata } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(tokenId ? { tokenId } : {}),
      ...(status ? { status } : {}),
    } as UpdateContentMetadataInput
    await trpcClient.contents.updateContentMetadata.mutate(input)
  }

  async uploadTokenMetadata({
    tokenId,
    metadata,
    trpcClient,
  }: {
    tokenId: string
    metadata: Record<string, unknown>
    trpcClient: TRPCClient<AppRouter>
  }): Promise<void> {
    await trpcClient.contents.uploadTokenMetadata.mutate({
      tokenId,
      metadata,
    })
  }

  async saveMetadata({
    tokenId,
    title,
    description,
    trpcClient,
    keys,
  }: {
    tokenId: string
    title: string
    keys: string[]
    description: string
    trpcClient: TRPCClient<AppRouter>
  }): Promise<void> {
    await this.uploadTokenMetadata({
      tokenId,
      metadata: { title, description, keys, image: r2BaseConfig.defaultImageUrl },
      trpcClient,
    })
  }

  async uploadLocationPreviewImage({
    contentId,
    file,
    filename,
    trpcClient,
  }: {
    contentId: string
    file: File
    filename?: string
    trpcClient: TRPCClient<AppRouter>
  }): Promise<void> {
    const lastDot = file.name.lastIndexOf('.')
    const fileExt = lastDot === -1 ? '' : file.name.slice(lastDot + 1)
    const originalBasename = lastDot === -1 ? file.name : file.name.slice(0, lastDot)
    const basename = filename?.includes('.')
      ? filename.slice(0, filename.lastIndexOf('.'))
      : (filename ?? originalBasename)
    const registeredName = fileExt ? `${basename}.${fileExt}` : basename

    const previewFile = await createImagePreview(file)

    const key = await uploadPreviewFile({ contentId, file: previewFile, trpcClient, filename: basename })

    await registerContentFile({
      contentId,
      key,
      bucket: 'preview',
      filename: registeredName,
      mimetype: file.type,
      trpcClient,
    })
  }

  createTrpcClient(): TRPCClient<AppRouter> {
    return createClient({
      trpcUrl: import.meta.env.VITE_TRPC_URL || 'http://localhost:8060/trpc',
      getAccessTokenFn: () => authStore.state.accessToken!,
    })
  }
}
