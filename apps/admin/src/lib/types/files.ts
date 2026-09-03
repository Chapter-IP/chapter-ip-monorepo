export type PreviewCandidate = { id: string; url: string; label: string; filename: string }

export type ExistingFile = { id: string; name: string; url: string; key: string }

export type ExistingFilesByBucket<Key extends string> = Record<Key, ExistingFile[]>

export type ExistingFilesContent = {
  id: string
  metadata?: { files_name?: unknown; preview_file_name?: unknown }
}

export type PreloadedExistingFiles<Key extends string> = {
  files: ExistingFilesByBucket<Key>
  allFiles: ExistingFilesByBucket<Key>
  previewUrl: string | null
  previewFileIds: string[]
}
