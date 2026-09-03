import type { AppRouter, TRPCClient } from '@repo/trpc/client'
import type UploadService from '$lib/upload/upload.service'

export const appendOriginalExtension = (name: string, file: File) => {
  const lastDot = file.name.lastIndexOf('.')
  const ext = lastDot === -1 ? '' : file.name.slice(lastDot + 1)
  return ext ? `${name}.${ext}` : name
}

export async function uploadPreviewIfNeeded({
  previewImage,
  contentId,
  uploadService,
  trpcClient,
}: {
  previewImage: File | null
  contentId: string
  uploadService: UploadService
  trpcClient: TRPCClient<AppRouter>
}): Promise<void> {
  if (!previewImage) return
  await uploadService.uploadPreviewImage({
    contentId,
    file: previewImage,
    filename: 'preview',
    trpcClient,
  })
}
