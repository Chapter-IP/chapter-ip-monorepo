import type { AppRouter, TRPCClient } from '@repo/trpc/client'

export const isPreviewBucket = (bucket?: string) => Boolean(bucket?.includes('preview'))

export const stripExtension = (name: string) => {
  const lastDot = name.lastIndexOf('.')
  return lastDot === -1 ? name : name.slice(0, lastDot)
}

export const matchesFileName = (label: string, allowedFileNames: Set<string>) => {
  if (allowedFileNames.has(label)) return true
  const labelBase = stripExtension(label)
  for (const allowed of allowedFileNames) {
    if (allowed === labelBase || stripExtension(allowed) === labelBase) return true
  }
  return false
}

export type PreviewCandidate = { id: string; url: string; label: string; filename: string }

export const selectPreview = (
  candidates: PreviewCandidate[],
  previewFileName: string | undefined,
): { previewUrl: string | null; previewFileIds: string[] } => {
  if (candidates.length === 0) return { previewUrl: null, previewFileIds: [] }

  const previewFileIds = candidates.map((candidate) => candidate.id)
  const preferredNames = previewFileName ? new Set([previewFileName]) : null
  const preferred =
    preferredNames &&
    candidates.find(
      (candidate) =>
        matchesFileName(candidate.label, preferredNames) || matchesFileName(candidate.filename, preferredNames),
    )
  const selected = preferred ?? candidates[candidates.length - 1]

  return { previewUrl: selected.url, previewFileIds }
}

export type ExistingFile = { id: string; name: string; url: string; key: string }
export type ExistingFilesByBucket<Key extends string> = Record<Key, ExistingFile[]>

type ExistingFilesContent = { id: string; metadata?: { files_name?: unknown; preview_file_name?: unknown } }

export type PreloadedExistingFiles<Key extends string> = {
  files: ExistingFilesByBucket<Key>
  allFiles: ExistingFilesByBucket<Key>
  previewUrl: string | null
  previewFileIds: string[]
}

export async function loadExistingFiles<Key extends string>(
  content: ExistingFilesContent,
  trpcClient: TRPCClient<AppRouter>,
  bucketKey: Key,
  emptyBucket: () => ExistingFilesByBucket<Key>,
): Promise<PreloadedExistingFiles<Key>> {
  const existingFiles = emptyBucket()
  const allExistingFiles = emptyBucket()
  const previewCandidates: PreviewCandidate[] = []

  if (!content.id) {
    return { files: existingFiles, allFiles: allExistingFiles, previewUrl: null, previewFileIds: [] }
  }

  const allowedFileNames = Array.isArray(content.metadata?.files_name) ? new Set(content.metadata.files_name) : null
  const previewFileName = content.metadata?.preview_file_name as string | undefined
  const { files } = await trpcClient.contents.getContentAllFilesLink.query({ contentId: content.id })

  for (const file of files ?? []) {
    if (isPreviewBucket(file.bucket)) {
      previewCandidates.push({ id: file.id, url: file.url, label: file.label, filename: file.filename })
      continue
    }

    const existingFile = { id: file.id, name: file.label, url: file.url, key: file.key }
    allExistingFiles[bucketKey].push(existingFile)
    if (!allowedFileNames || matchesFileName(file.label, allowedFileNames)) {
      existingFiles[bucketKey].push({ ...existingFile })
    }
  }

  const { previewUrl, previewFileIds } = selectPreview(previewCandidates, previewFileName)

  return { files: existingFiles, allFiles: allExistingFiles, previewUrl, previewFileIds }
}
