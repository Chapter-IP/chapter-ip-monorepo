import type { NamedUpload, UploadProgressEvent } from './upload.service'
import { computePendingUploadUnits } from './upload-progress-ui'

export type UploadSessionProgressSetter = (event: UploadProgressEvent) => void

export type UploadSession = {
  setProgress: UploadSessionProgressSetter
  end: () => void
}

export type UploadSessionStore = {
  setUploadProgress: (event: UploadProgressEvent) => void
  clearUploadProgress: () => void
  setLoading: (loading: boolean) => void
}

export function createUploadSessionController(store: UploadSessionStore) {
  let generation = 0

  const begin = (): UploadSession => {
    const currentGeneration = ++generation
    return {
      setProgress: (event: UploadProgressEvent) => {
        if (generation === currentGeneration) {
          store.setUploadProgress(event)
        }
      },
      end: () => {
        if (generation === currentGeneration) {
          store.clearUploadProgress()
          store.setLoading(false)
        }
      },
    }
  }

  const invalidate = () => {
    generation++
    store.clearUploadProgress()
  }

  return { begin, invalidate }
}

export function startUploadingPhase(
  setProgress: UploadSessionProgressSetter,
  uploads: NamedUpload[],
  includePreviews = true,
) {
  if (uploads.length === 0) return

  const pendingFiles = computePendingUploadUnits(uploads, includePreviews)
  setProgress({ phase: 'uploading', overallProgress: 0, pendingFiles })
}
