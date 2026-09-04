import type { UploadProgressEvent } from '$lib/upload/upload.service'
import type { WorkFileKey } from '$lib/constants/workFileBuckets'
import type { WorkLicensingMetadata } from '@repo/content-types/works'
import type { ExistingFilesByBucket } from '$lib/stores/file-preload'

export type WorkState = {
  files: {
    works: File[]
  }
  title: string
  contentType: string
  description: string
  genre: string[]
  authors: string[]
  licensing: WorkLicensingMetadata
  confirmations: {
    rightsConfirmed: boolean
  }
  existingFiles: ExistingFilesByBucket<WorkFileKey>
  isEditing: boolean
  ui: {
    loading: boolean
    uploadProgress: UploadProgressEvent | null
  }
}

export type ExistingContentFile = {
  id: string
  key: string
}
