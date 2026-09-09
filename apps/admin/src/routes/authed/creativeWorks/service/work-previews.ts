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

export type ExistingSampleFile = { id: string; name: string; url: string }
export type WorkSampleSource = File | ExistingSampleFile | undefined

export function getWorkSampleSource(state: {
  contentType: string
  files: { works: File[]; 'preview-files': File[] }
  existingFiles: { works: ExistingSampleFile[]; 'preview-files': ExistingSampleFile[] }
}): WorkSampleSource {
  const bucket = state.contentType === 'Lyrics' ? 'works' : 'preview-files'
  return state.existingFiles[bucket][0] ?? state.files[bucket][0]
}

/** The public sample always has its own preview-bucket object, named sample.<extension>. */
export async function syncWorkSample({
  source,
  existingPreviewFiles = [],
  preserveExistingSample = false,
  onRemoved = () => {},
  ...uploadContext
}: {
  source: WorkSampleSource
  existingPreviewFiles?: ExistingSampleFile[]
  preserveExistingSample?: boolean
  onRemoved?: (fileId: string) => void
  uploadService: Pick<UploadService, 'uploadPreviewFiles'>
  trpcClient: PreviewClient
  contentId: string
}): Promise<string[]> {
  const keptSample =
    source && preserveExistingSample
      ? existingPreviewFiles.find((file) => /^sample\.[^.]+$/.test(file.name))
      : undefined
  let file: File | undefined
  if (source && !keptSample) {
    if (source instanceof File) file = source
    else {
      // Read an existing source before removing/replacing its public object.
      const response = await fetch(source.url)
      if (!response.ok) throw new Error(`Sample source request failed: ${response.status}`)
      const blob = await response.blob()
      file = new File([blob], source.name, { type: blob.type })
    }
  }
  await removeWorkPreviews({
    trpcClient: uploadContext.trpcClient,
    initialFileIds: existingPreviewFiles.map(({ id }) => id),
    keptFileIds: new Set(keptSample ? [keptSample.id] : []),
    onRemoved,
  })
  if (keptSample) return [keptSample.name]
  if (!file) return []
  return uploadWorkPreviews({ ...uploadContext, uploads: [{ file, name: 'sample' }] })
}
