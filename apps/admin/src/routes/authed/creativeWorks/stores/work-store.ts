import { writable, derived } from 'svelte/store'
import type { UploadProgressEvent } from '$lib/upload/upload.service'
import { type WorkFileKey } from '$lib/constants/workFileBuckets'
import type { WorkMetadataInput, WorkLicensingMetadata } from '@repo/content-types/works'
import {
  type ExistingFilesByBucket as ExistingFilesByBucketGeneric,
  type PreloadedExistingFiles,
  loadExistingFiles as loadFilesFromContent,
} from '$lib/stores/file-preload'
import type { WorkState } from '../types/work-store.types'

export { isPreviewBucket } from '$lib/stores/file-preload'

type ExistingFilesByBucket = ExistingFilesByBucketGeneric<WorkFileKey>

const emptyExistingFiles = (): ExistingFilesByBucket => ({
  works: [],
})

export async function loadExistingFiles(
  content: { id: string; metadata?: WorkMetadataInput },
  trpcClient: Parameters<typeof loadFilesFromContent>[1],
): Promise<PreloadedExistingFiles<WorkFileKey>> {
  return loadFilesFromContent(content, trpcClient, 'works', emptyExistingFiles)
}

function createWorkStore() {
  const { subscribe, set, update } = writable<WorkState>({
    files: {
      works: [],
    },
    previewImage: null,
    existingPreviewUrl: null,
    title: '',
    contentType: '',
    description: '',
    genre: [],
    authors: [],
    licensing: {
      licenseTypes: {
        'single-use': true,
      },
      licensePrices: {
        'single-use': '',
      },
      agreedToFee: false,
    },
    confirmations: {
      rightsConfirmed: false,
    },
    existingFiles: emptyExistingFiles(),
    isEditing: false,
    ui: {
      loading: false,
      uploadProgress: null,
    },
  })

  return {
    subscribe,
    set,
    appendMediaFiles(key: WorkFileKey, newFiles: File[]) {
      update((s) => ({
        ...s,
        files: {
          ...s.files,
          [key]: [...(s.files[key] as File[]), ...newFiles],
        },
      }))
    },
    removeMediaFile(key: WorkFileKey, index: number) {
      update((s) => ({
        ...s,
        files: {
          ...s.files,
          [key]: (s.files[key] as File[]).filter((_, i) => i !== index),
        },
      }))
    },
    removeExistingFile(key: WorkFileKey, index: number) {
      update((s) => ({
        ...s,
        existingFiles: {
          ...s.existingFiles,
          [key]: s.existingFiles[key].filter((_, i) => i !== index),
        },
      }))
    },
    toggleGenre(genre: string) {
      update((s) => ({
        ...s,
        genre: s.genre.includes(genre) ? s.genre.filter((g) => g !== genre) : [...s.genre, genre],
      }))
    },
    addGenre(genre: string) {
      const trimmed = genre.trim()
      if (!trimmed) return
      update((s) => (s.genre.includes(trimmed) ? s : { ...s, genre: [...s.genre, trimmed] }))
    },
    addAuthor(name: string) {
      const trimmed = name.trim()
      if (!trimmed) return
      update((s) => (s.authors.includes(trimmed) ? s : { ...s, authors: [...s.authors, trimmed] }))
    },
    removeAuthor(index: number) {
      update((s) => ({ ...s, authors: s.authors.filter((_, i) => i !== index) }))
    },
    setPreviewImage: (file: File | null) => update((s) => ({ ...s, previewImage: file })),
    setExistingPreviewUrl: (url: string | null) => update((s) => ({ ...s, existingPreviewUrl: url })),
    setLicenseTypeEnabled: (id: string, value: boolean) =>
      update((s) => {
        const nextLicensing = {
          ...s.licensing,
          licenseTypes: { ...s.licensing.licenseTypes, [id]: value },
          licensePrices: { ...s.licensing.licensePrices, [id]: value ? s.licensing.licensePrices[id] || '' : '' },
        }
        return { ...s, licensing: nextLicensing }
      }),
    setLicenseTypePrice: (id: string, value: string) =>
      update((s) => {
        const safeValue = value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
        const nextLicensing = {
          ...s.licensing,
          licensePrices: { ...s.licensing.licensePrices, [id]: safeValue },
        }
        return { ...s, licensing: nextLicensing }
      }),
    setAgreedToFee: (value: boolean) => update((s) => ({ ...s, licensing: { ...s.licensing, agreedToFee: value } })),
    setRightsConfirmed: (value: boolean) =>
      update((s) => ({ ...s, confirmations: { ...s.confirmations, rightsConfirmed: value } })),
    setLoading: (loading: boolean) => update((s) => ({ ...s, ui: { ...s.ui, loading } })),
    setUploadProgress: (uploadProgress: UploadProgressEvent) =>
      update((s) => ({ ...s, ui: { ...s.ui, uploadProgress } })),
    clearUploadProgress: () => update((s) => ({ ...s, ui: { ...s.ui, uploadProgress: null } })),
    hydrateFromContent(
      content: { metadata?: WorkMetadataInput; tags?: string[] },
      existingFiles: ExistingFilesByBucket = emptyExistingFiles(),
      existingPreviewUrl: string | null = null,
    ) {
      const metadata = (content.metadata ?? {}) as Record<string, unknown>
      const title = (metadata.name as string) ?? ''
      const contentType = (metadata.contentType as string) ?? ''
      const description = (metadata.description as string) ?? ''
      const genre = (metadata.genre as string[]) ?? []
      const author = (metadata.authors as string[]) ?? []
      const licensing = (metadata.licensing ?? {}) as Partial<WorkLicensingMetadata>

      update((s) => ({
        ...s,
        title: title ?? '',
        contentType: contentType ?? '',
        description: description ?? '',
        genre: Array.isArray(genre) ? genre : [],
        authors: Array.isArray(author) ? author : [],
        licensing: {
          ...s.licensing,
          ...licensing,
          licenseTypes: { ...s.licensing.licenseTypes, ...(licensing?.licenseTypes ?? {}) },
          licensePrices: { ...s.licensing.licensePrices, ...(licensing?.licensePrices ?? {}) },
        },
        confirmations: { rightsConfirmed: true },
        existingFiles,
        existingPreviewUrl,
        isEditing: Object.values(existingFiles).some((files) => files.length > 0),
      }))
    },
    reset: () =>
      set({
        files: {
          works: [],
        },
        previewImage: null,
        existingPreviewUrl: null,
        title: '',
        contentType: '',
        description: '',
        genre: [],
        authors: [],
        licensing: {
          licenseTypes: {
            'single-use': true,
          },
          licensePrices: {
            'single-use': '',
          },
          agreedToFee: false,
        },
        confirmations: { rightsConfirmed: false },
        existingFiles: emptyExistingFiles(),
        isEditing: false,
        ui: { loading: false, uploadProgress: null },
      }),
  }
}

export const workStore = createWorkStore()

export const isFormValid = derived(workStore, ($s) => {
  const enabledLicenseTypes = Object.entries($s.licensing.licenseTypes).filter(([, enabled]) => enabled)
  const hasLicenseType = enabledLicenseTypes.length > 0

  if ($s.isEditing) {
    return hasLicenseType && $s.licensing.agreedToFee
  }

  const hasValidLicensePrice = enabledLicenseTypes.every(([id]) => Number($s.licensing.licensePrices[id] || 0) >= 0.5)

  return hasLicenseType && hasValidLicensePrice && $s.licensing.agreedToFee
})
