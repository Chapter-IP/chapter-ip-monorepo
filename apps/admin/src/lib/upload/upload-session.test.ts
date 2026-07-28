import { describe, expect, it, vi } from 'vitest'

vi.mock('./image-preview.service', () => ({
  isPreviewImage: (file: File) => file.type.startsWith('image/'),
}))

import { createUploadSessionController, startUploadingPhase } from './upload-session'
import type { UploadProgressEvent } from './upload.service'

const createMockStore = () => ({
  setUploadProgress: vi.fn(),
  clearUploadProgress: vi.fn(),
  setLoading: vi.fn(),
})

describe('createUploadSessionController', () => {
  it('forwards setProgress and end for the active upload session', () => {
    const store = createMockStore()
    const controller = createUploadSessionController(store)
    const uploadSession = controller.begin()
    const progress = { phase: 'uploading' as const, overallProgress: 0.5 }

    uploadSession.setProgress(progress)
    uploadSession.end()

    expect(store.setUploadProgress).toHaveBeenCalledWith(progress)
    expect(store.clearUploadProgress).toHaveBeenCalledTimes(1)
    expect(store.setLoading).toHaveBeenCalledWith(false)
  })

  it('clears progress on invalidate', () => {
    const store = createMockStore()
    const controller = createUploadSessionController(store)

    controller.begin()
    controller.invalidate()

    expect(store.clearUploadProgress).toHaveBeenCalledTimes(1)
  })

  it('ignores stale setProgress after invalidate', () => {
    const store = createMockStore()
    const controller = createUploadSessionController(store)
    const uploadSession = controller.begin()

    controller.invalidate()
    uploadSession.setProgress({ phase: 'uploading', overallProgress: 0.5 })

    expect(store.setUploadProgress).not.toHaveBeenCalled()
  })

  it('ignores stale end after invalidate', () => {
    const store = createMockStore()
    const controller = createUploadSessionController(store)
    const uploadSession = controller.begin()

    controller.invalidate()
    store.clearUploadProgress.mockClear()
    store.setLoading.mockClear()
    uploadSession.end()

    expect(store.clearUploadProgress).not.toHaveBeenCalled()
    expect(store.setLoading).not.toHaveBeenCalled()
  })

  it('ignores stale setProgress after a newer begin', () => {
    const store = createMockStore()
    const controller = createUploadSessionController(store)
    const oldSession = controller.begin()
    const newSession = controller.begin()

    oldSession.setProgress({ phase: 'uploading', overallProgress: 0.25 })
    newSession.setProgress({ phase: 'minting', overallProgress: 1 })

    expect(store.setUploadProgress).toHaveBeenCalledTimes(1)
    expect(store.setUploadProgress).toHaveBeenCalledWith({ phase: 'minting', overallProgress: 1 })
  })

  it('does not clear progress when an old upload session ends after a newer begin', () => {
    const store = createMockStore()
    const controller = createUploadSessionController(store)
    const oldSession = controller.begin()

    controller.begin()
    oldSession.end()

    expect(store.clearUploadProgress).not.toHaveBeenCalled()
    expect(store.setLoading).not.toHaveBeenCalledWith(false)
  })
})

describe('startUploadingPhase', () => {
  it('sets uploading progress with pending file names when uploads are present', () => {
    const setProgress = vi.fn<(event: UploadProgressEvent) => void>()
    const imageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
    const uploads = [{ file: imageFile, name: 'likeness-1' }]

    startUploadingPhase(setProgress, [])
    expect(setProgress).not.toHaveBeenCalled()

    startUploadingPhase(setProgress, uploads)
    expect(setProgress).toHaveBeenCalledWith({
      phase: 'uploading',
      overallProgress: 0,
      pendingFiles: [
        { id: 'likeness-1', label: 'photo.jpg' },
        { id: 'likeness-1 (preview)', label: 'photo.jpg (preview)' },
      ],
    })
  })

  it('omits preview units when includePreviews is false', () => {
    const setProgress = vi.fn<(event: UploadProgressEvent) => void>()
    const imageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
    const uploads = [{ file: imageFile, name: 'likeness-1' }]

    startUploadingPhase(setProgress, uploads, false)

    expect(setProgress).toHaveBeenCalledWith({
      phase: 'uploading',
      overallProgress: 0,
      pendingFiles: [{ id: 'likeness-1', label: 'photo.jpg' }],
    })
  })
})
