import { describe, expect, it, vi } from 'vitest'

vi.mock('./image-preview.service', () => ({
  isPreviewImage: (file: File) => file.type.startsWith('image/'),
}))

import {
  applyProgressEventToFileMap,
  clampPercent,
  computePendingUploadUnits,
  displayOverallPercent,
  overallPercent,
} from './upload-progress-ui'
import type { NamedUpload } from './upload.service'

const imageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
const videoFile = new File(['video'], 'clip.mp4', { type: 'video/mp4' })

const uploads: NamedUpload[] = [
  { file: imageFile, name: 'likeness-1' },
  { file: videoFile, name: 'likeness-2' },
]

describe('computePendingUploadUnits', () => {
  it('includes content files only when previews are disabled', () => {
    expect(computePendingUploadUnits(uploads, false)).toEqual([
      { id: 'likeness-1', label: 'photo.jpg' },
      { id: 'likeness-2', label: 'clip.mp4' },
    ])
  })

  it('includes preview units for previewable images when enabled', () => {
    expect(computePendingUploadUnits(uploads, true)).toEqual([
      { id: 'likeness-1', label: 'photo.jpg' },
      { id: 'likeness-1 (preview)', label: 'photo.jpg (preview)' },
      { id: 'likeness-2', label: 'clip.mp4' },
    ])
  })

  it('keeps separate units when multiple uploads share the same file name', () => {
    const duplicateNameUploads: NamedUpload[] = [
      { file: new File(['a'], 'photo.jpg', { type: 'image/jpeg' }), name: 'headshot_1' },
      { file: new File(['b'], 'photo.jpg', { type: 'image/jpeg' }), name: 'headshot_2' },
    ]

    expect(computePendingUploadUnits(duplicateNameUploads, false)).toEqual([
      { id: 'headshot_1', label: 'photo.jpg' },
      { id: 'headshot_2', label: 'photo.jpg' },
    ])
  })
})

describe('clampPercent', () => {
  it('clamps and rounds values into 0-100', () => {
    expect(clampPercent(-0.2)).toBe(0)
    expect(clampPercent(0.456)).toBe(0)
    expect(clampPercent(0.556)).toBe(1)
    expect(clampPercent(1.2)).toBe(1)
    expect(clampPercent(120)).toBe(100)
  })
})

describe('overallPercent', () => {
  it('converts fractional progress to a percentage', () => {
    expect(overallPercent(0.5)).toBe(50)
    expect(overallPercent(1)).toBe(100)
  })
})

describe('displayOverallPercent', () => {
  it('allows 100% only during the uploading phase', () => {
    expect(displayOverallPercent(1, 'uploading')).toBe(100)
    expect(displayOverallPercent(1, 'minting')).toBe(99)
    expect(displayOverallPercent(1, 'finalizing')).toBe(99)
    expect(displayOverallPercent(1, 'saving-metadata')).toBe(99)
  })

  it('passes through partial progress for all phases', () => {
    expect(displayOverallPercent(0.5, 'minting')).toBe(50)
    expect(displayOverallPercent(0.5, 'uploading')).toBe(50)
  })
})

describe('applyProgressEventToFileMap', () => {
  const emptyState = { fileMap: {}, orderedIds: [] as string[], labelById: {} as Record<string, string> }

  it('seeds all pending files at 0% on upload start', () => {
    const pendingFiles = [
      { id: 'likeness-1', label: 'photo.jpg' },
      { id: 'likeness-1 (preview)', label: 'photo.jpg (preview)' },
      { id: 'likeness-2', label: 'clip.mp4' },
    ]

    const result = applyProgressEventToFileMap(emptyState.fileMap, emptyState.orderedIds, emptyState.labelById, {
      phase: 'uploading',
      overallProgress: 0,
      pendingFiles,
    })

    expect(result.orderedIds).toEqual(['likeness-1', 'likeness-1 (preview)', 'likeness-2'])
    expect(result.fileMap).toEqual({
      'likeness-1': 0,
      'likeness-1 (preview)': 0,
      'likeness-2': 0,
    })
    expect(result.labelById).toEqual({
      'likeness-1': 'photo.jpg',
      'likeness-1 (preview)': 'photo.jpg (preview)',
      'likeness-2': 'clip.mp4',
    })
  })

  it('updates in-progress file progress without reordering', () => {
    const seeded = applyProgressEventToFileMap(emptyState.fileMap, emptyState.orderedIds, emptyState.labelById, {
      phase: 'uploading',
      overallProgress: 0,
      pendingFiles: [
        { id: 'likeness-1', label: 'photo.jpg' },
        { id: 'likeness-2', label: 'clip.mp4' },
      ],
    })

    const updated = applyProgressEventToFileMap(seeded.fileMap, seeded.orderedIds, seeded.labelById, {
      phase: 'uploading',
      overallProgress: 0.25,
      fileName: 'likeness-1',
      progress: 0.5,
    })

    expect(updated.orderedIds).toEqual(['likeness-1', 'likeness-2'])
    expect(updated.fileMap).toEqual({
      'likeness-1': 0.5,
      'likeness-2': 0,
    })
  })

  it('removes completed files from the active list', () => {
    const seeded = applyProgressEventToFileMap(emptyState.fileMap, emptyState.orderedIds, emptyState.labelById, {
      phase: 'uploading',
      overallProgress: 0,
      pendingFiles: [
        { id: 'likeness-1', label: 'photo.jpg' },
        { id: 'likeness-2', label: 'clip.mp4' },
      ],
    })

    const completed = applyProgressEventToFileMap(seeded.fileMap, seeded.orderedIds, seeded.labelById, {
      phase: 'uploading',
      overallProgress: 0.5,
      fileName: 'likeness-1',
      progress: 1,
    })

    expect(completed.orderedIds).toEqual(['likeness-2'])
    expect(completed.fileMap).toEqual({ 'likeness-2': 0 })
  })

  it('tracks duplicate file names independently by unique id', () => {
    const pendingFiles = [
      { id: 'headshot_1', label: 'photo.jpg' },
      { id: 'headshot_2', label: 'photo.jpg' },
    ]

    const seeded = applyProgressEventToFileMap(emptyState.fileMap, emptyState.orderedIds, emptyState.labelById, {
      phase: 'uploading',
      overallProgress: 0,
      pendingFiles,
    })

    const firstInProgress = applyProgressEventToFileMap(seeded.fileMap, seeded.orderedIds, seeded.labelById, {
      phase: 'uploading',
      overallProgress: 0.25,
      fileName: 'headshot_1',
      progress: 0.5,
    })

    expect(firstInProgress.orderedIds).toEqual(['headshot_1', 'headshot_2'])
    expect(firstInProgress.fileMap).toEqual({
      headshot_1: 0.5,
      headshot_2: 0,
    })

    const firstComplete = applyProgressEventToFileMap(
      firstInProgress.fileMap,
      firstInProgress.orderedIds,
      firstInProgress.labelById,
      {
        phase: 'uploading',
        overallProgress: 0.5,
        fileName: 'headshot_1',
        progress: 1,
      },
    )

    expect(firstComplete.orderedIds).toEqual(['headshot_2'])
    expect(firstComplete.fileMap).toEqual({ headshot_2: 0 })
    expect(firstComplete.labelById).toEqual({
      headshot_1: 'photo.jpg',
      headshot_2: 'photo.jpg',
    })
  })

  it('ignores file updates during non-uploading phases', () => {
    const seeded = applyProgressEventToFileMap(emptyState.fileMap, emptyState.orderedIds, emptyState.labelById, {
      phase: 'uploading',
      overallProgress: 0,
      pendingFiles: [{ id: 'likeness-1', label: 'photo.jpg' }],
    })

    const result = applyProgressEventToFileMap(seeded.fileMap, seeded.orderedIds, seeded.labelById, {
      phase: 'minting',
      overallProgress: 1,
      fileName: 'likeness-1',
      progress: 0.5,
    })

    expect(result).toEqual(seeded)
  })
})
