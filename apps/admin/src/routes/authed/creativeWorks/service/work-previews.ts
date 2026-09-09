import { notify, ToastType } from '@repo/ui-components'
import { appendOriginalExtension } from '$lib/helpers/work-upload'
import type UploadService from '$lib/upload/upload.service'
import type { NamedUpload } from '$lib/upload/upload.service'

type PreviewClient = ReturnType<UploadService['createTrpcClient']>

export async function uploadWorkPreviews({
  uploadService,
  trpcClient,
  contentId,
  uploads,
}: {
  uploadService: Pick<UploadService, 'uploadPreviewFiles'>
  trpcClient: PreviewClient
  contentId: string
  uploads: NamedUpload[]
}): Promise<string[]> {
  const uploadedNames: string[] = []
  for (const upload of uploads) {
    try {
      await uploadService.uploadPreviewFiles({ trpcClient, contentId, uploads: [upload] })
      uploadedNames.push(appendOriginalExtension(upload.name, upload.file))
    } catch (error) {
      console.error('Error uploading preview file:', error)
      notify(
        `Preview upload failed for ${upload.file.name}. The work will be saved without this sample file.`,
        ToastType.FAIL,
      )
    }
  }
  return uploadedNames
}

export async function removeWorkPreviews({
  trpcClient,
  initialFileIds,
  keptFileIds,
  onRemoved,
}: {
  trpcClient: PreviewClient
  initialFileIds: string[]
  keptFileIds: Set<string>
  onRemoved: (fileId: string) => void
}): Promise<void> {
  for (const fileId of initialFileIds) {
    if (keptFileIds.has(fileId)) continue
    // A failed deletion must stop the save so that the user can retry it.
    await trpcClient.contents.removeContentFile.mutate({ fileId })
    onRemoved(fileId)
  }
}
