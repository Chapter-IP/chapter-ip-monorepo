import { isPreviewImage } from './image-preview.service'
import type { NamedUpload, UploadProgressEvent } from './upload.service'

export type FileProgressMap = Record<string, number>

export type PendingUploadUnit = {
  id: string
  label: string
}

export function computePendingUploadUnits(uploads: NamedUpload[], includePreviews: boolean): PendingUploadUnit[] {
  const units: PendingUploadUnit[] = []

  for (const { file, name } of uploads) {
    units.push({ id: name, label: file.name })
    if (includePreviews && isPreviewImage(file)) {
      units.push({ id: `${name} (preview)`, label: `${file.name} (preview)` })
    }
  }

  return units
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function overallPercent(overallProgress: number): number {
  return clampPercent(overallProgress * 100)
}

function seedFromPendingUnits(pendingFiles: PendingUploadUnit[]): {
  fileMap: FileProgressMap
  orderedIds: string[]
  labelById: Record<string, string>
} {
  return {
    fileMap: Object.fromEntries(pendingFiles.map((unit) => [unit.id, 0])),
    orderedIds: pendingFiles.map((unit) => unit.id),
    labelById: Object.fromEntries(pendingFiles.map((unit) => [unit.id, unit.label])),
  }
}

function shouldResetFromPendingList(orderedIds: string[], pendingFiles: PendingUploadUnit[]): boolean {
  if (orderedIds.length === 0) return true

  const pendingIds = pendingFiles.map((unit) => unit.id)

  return pendingIds.length !== orderedIds.length || pendingIds.some((id, index) => id !== orderedIds[index])
}

export function applyProgressEventToFileMap(
  fileMap: FileProgressMap,
  orderedIds: string[],
  labelById: Record<string, string>,
  event: UploadProgressEvent,
): { fileMap: FileProgressMap; orderedIds: string[]; labelById: Record<string, string> } {
  if (
    event.pendingFiles?.length &&
    event.overallProgress === 0 &&
    event.phase === 'uploading' &&
    shouldResetFromPendingList(orderedIds, event.pendingFiles)
  ) {
    return seedFromPendingUnits(event.pendingFiles)
  }

  if (event.phase !== 'uploading' || !event.fileName) {
    return { fileMap, orderedIds, labelById }
  }

  const fileId = event.fileName
  const progress = event.progress ?? 0

  if (progress >= 1) {
    const nextMap = { ...fileMap }
    delete nextMap[fileId]

    return {
      fileMap: nextMap,
      orderedIds: orderedIds.filter((id) => id !== fileId),
      labelById,
    }
  }

  const nextMap = { ...fileMap, [fileId]: progress }
  const nextOrderedIds = orderedIds.includes(fileId) ? orderedIds : [...orderedIds, fileId]

  return { fileMap: nextMap, orderedIds: nextOrderedIds, labelById }
}
