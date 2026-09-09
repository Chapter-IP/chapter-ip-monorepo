import { writable, derived } from 'svelte/store'
import type { UploadProgressEvent } from '$lib/upload/upload.service'
import { type WorkFileKey } from '$lib/constants/workFileBuckets'
import type { WorkMetadataInput, WorkLicensingMetadata } from '@repo/content-types/works'
import { LICENSE_TYPE_OPTIONS } from '@repo/content-types/works'
import {
  type PreloadedExistingFiles,
  isPreviewBucket,
  loadExistingFiles as loadFilesFromContent,
  matchesFileName,
} from '$lib/stores/file-preload'
import type { ExistingFile, ExistingFilesByBucket as ExistingFilesByBucketGeneric } from '$lib/types/files'
import type { WorkState } from '../types/work-store.types'

export { isPreviewBucket } from '$lib/stores/file-preload'

type ExistingFilesByBucket = ExistingFilesByBucketGeneric<WorkFileKey>

const emptyExistingFiles = (): ExistingFilesByBucket => ({
  works: [],
  'preview-files': [],
})

const loadPreviewFiles = async (
  content: { id: string; metadata?: WorkMetadataInput },
  trpcClient: Parameters<typeof loadFilesFromContent>[1],
): Promise<ExistingFile[]> => {
  const previewNames = Array.isArray(content.metadata?.preview_files_name)
    ? new Set(content.metadata.preview_files_name)
    : content.metadata?.sample_file_name
      ? new Set([content.metadata.sample_file_name])
      : null
  if (!previewNames || !content.id) return []
  const { files } = await trpcClient.contents.getContentAllFilesLink.query({ contentId: content.id })
  return (files ?? [])
    .filter((file) => isPreviewBucket(file.bucket) && matchesFileName(file.label, previewNames))
    .map((file) => ({ id: file.id, name: file.label, url: file.url, key: file.key }))
}

export async function loadExistingFiles(
  content: { id: string; metadata?: WorkMetadataInput },
  trpcClient: Parameters<typeof loadFilesFromContent>[1],
): Promise<PreloadedExistingFiles<WorkFileKey>> {
  const result = await loadFilesFromContent<WorkFileKey>(content, trpcClient, 'works', emptyExistingFiles)
  const previewFiles = await loadPreviewFiles(content, trpcClient)
  return { ...result, files: { ...result.files, 'preview-files': previewFiles } }
}

function createWorkStore() {
  const { subscribe, set, update } = writable<WorkState>({
    files: {
      works: [],
      'preview-files': [],
    },
    title: '',
    contentType: '',
    description: '',
    sampleText: '',
    genre: [],
    authors: [],
    licensing: {
      licenseTypes: {
        'single-use': true,
        perpetual: false,
      },
      licensePrices: {
        'single-use': '',
        perpetual: '',
      },
      permittedUses: {},
      allowAiTraining: false,
      attributionRequired: false,
      canBuyerModify: false,
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
    setSampleText(value: string | null) {
      update((s) => ({ ...s, sampleText: value ?? '' }))
    },
    setContentType(value: string) {
      update((s) => ({ ...s, contentType: value }))
    },
    clearPreviewFiles() {
      update((s) => ({
        ...s,
        files: { ...s.files, 'preview-files': [] },
        existingFiles: { ...s.existingFiles, 'preview-files': [] },
        sampleText: '',
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
    setPermittedUse: (id: string, value: boolean) =>
      update((s) => ({
        ...s,
        licensing: { ...s.licensing, permittedUses: { ...s.licensing.permittedUses, [id]: value } },
      })),
    setAdditionalInfo: (key: 'allowAiTraining' | 'attributionRequired' | 'canBuyerModify', value: boolean) =>
      update((s) => ({ ...s, licensing: { ...s.licensing, [key]: value } })),
    setRightsConfirmed: (value: boolean) =>
      update((s) => ({ ...s, confirmations: { ...s.confirmations, rightsConfirmed: value } })),
    setLoading: (loading: boolean) => update((s) => ({ ...s, ui: { ...s.ui, loading } })),
    setUploadProgress: (uploadProgress: UploadProgressEvent) =>
      update((s) => ({ ...s, ui: { ...s.ui, uploadProgress } })),
    clearUploadProgress: () => update((s) => ({ ...s, ui: { ...s.ui, uploadProgress: null } })),
    hydrateFromContent(
      content: { metadata?: WorkMetadataInput; tags?: string[] },
      existingFiles: ExistingFilesByBucket = emptyExistingFiles(),
    ) {
      const metadata = (content.metadata ?? {}) as Record<string, unknown>
      const title = (metadata.name as string) ?? ''
      const contentType = (metadata.contentType as string) ?? ''
      const description = (metadata.description as string) ?? ''
      const genre = (metadata.genre as string[]) ?? []
      const author = (metadata.authors as string[]) ?? []
      const sampleText = (metadata.sample_text as string) ?? ''
      const licensing = (metadata.licensing ?? {}) as Partial<WorkLicensingMetadata>

      update((s) => ({
        ...s,
        title: title ?? '',
        contentType: contentType ?? '',
        description: description ?? '',
        sampleText: sampleText ?? '',
        genre: Array.isArray(genre) ? genre : [],
        authors: Array.isArray(author) ? author : [],
        licensing: {
          ...s.licensing,
          ...licensing,
          licenseTypes: { ...s.licensing.licenseTypes, ...(licensing?.licenseTypes ?? {}) },
          licensePrices: { ...s.licensing.licensePrices, ...(licensing?.licensePrices ?? {}) },
          permittedUses: { ...s.licensing.permittedUses, ...(licensing?.permittedUses ?? {}) },
        },
        confirmations: { rightsConfirmed: true },
        existingFiles,
        isEditing: Object.values(existingFiles).some((files) => files.length > 0),
      }))
    },
    reset: () =>
      set({
        files: {
          works: [],
          'preview-files': [],
        },
        title: '',
        contentType: '',
        description: '',
        sampleText: '',
        genre: [],
        authors: [],
        licensing: {
          licenseTypes: {
            'single-use': true,
            perpetual: false,
          },
          licensePrices: {
            'single-use': '',
            perpetual: '',
          },
          permittedUses: {},
          allowAiTraining: false,
          attributionRequired: false,
          canBuyerModify: false,
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
  const enabledLicenseTypes = LICENSE_TYPE_OPTIONS.filter(({ value }) => $s.licensing.licenseTypes[value])
  const hasLicenseType = enabledLicenseTypes.length > 0

  const hasValidLicensePrice = enabledLicenseTypes.every(
    ({ value }) => Number($s.licensing.licensePrices[value] || 0) >= 0.5,
  )

  return hasLicenseType && hasValidLicensePrice && $s.licensing.agreedToFee
})
