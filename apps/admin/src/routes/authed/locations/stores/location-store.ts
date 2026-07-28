import { writable, derived } from 'svelte/store'
import type { UploadProgressEvent } from '$lib/upload/upload.service'
import type { AppRouter, TRPCClient } from '@repo/trpc/client'
import { type LocationFileKey } from '$lib/constants/locationFileBuckets'
import type { LocationAddress, LocationLicensingMetadata, LocationMetadataInput } from '@repo/content-types/location'

type ExistingFile = { id: string; name: string; url: string; key: string }
type ExistingFilesByBucket = Record<LocationFileKey, ExistingFile[]>

const emptyExistingFiles = (): ExistingFilesByBucket => ({
  locations: [],
})

export const isPreviewBucket = (bucket?: string) => Boolean(bucket?.includes('preview'))

const stripExtension = (name: string) => {
  const lastDot = name.lastIndexOf('.')
  return lastDot === -1 ? name : name.slice(0, lastDot)
}

const matchesFileName = (label: string, allowedFileNames: Set<string>) => {
  if (allowedFileNames.has(label)) return true
  const labelBase = stripExtension(label)
  for (const allowed of allowedFileNames) {
    if (allowed === labelBase || stripExtension(allowed) === labelBase) return true
  }
  return false
}

type PreviewCandidate = { id: string; url: string; label: string; filename: string }

const selectPreview = (
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

export async function loadExistingFiles(
  content: { id: string; metadata?: LocationMetadataInput },
  trpcClient: TRPCClient<AppRouter>,
): Promise<{
  files: ExistingFilesByBucket
  allFiles: ExistingFilesByBucket
  previewUrl: string | null
  previewFileIds: string[]
}> {
  const existingFiles = emptyExistingFiles()
  const allExistingFiles = emptyExistingFiles()
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
    allExistingFiles.locations.push(existingFile)
    if (!allowedFileNames || matchesFileName(file.label, allowedFileNames)) {
      existingFiles.locations.push({ ...existingFile })
    }
  }

  const { previewUrl, previewFileIds } = selectPreview(previewCandidates, previewFileName)

  return { files: existingFiles, allFiles: allExistingFiles, previewUrl, previewFileIds }
}

interface LocationState {
  files: {
    locations: File[]
  }
  previewImage: File | null
  existingPreviewUrl: string | null
  name: string
  description: string
  tags: string[]
  address: LocationAddress
  licensing: LocationLicensingMetadata
  confirmations: {
    rightsConfirmed: boolean
  }
  existingFiles: ExistingFilesByBucket
  isEditing: boolean
  ui: {
    loading: boolean
    uploadProgress: UploadProgressEvent | null
  }
}

function createLocationStore() {
  const { subscribe, set, update } = writable<LocationState>({
    files: {
      locations: [],
    },
    previewImage: null,
    existingPreviewUrl: null,
    name: '',
    description: '',
    tags: [],
    address: { street: '', apt: '', city: '', state: '', zip: '' },
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
    appendMediaFiles(key: LocationFileKey, newFiles: File[]) {
      update((s) => ({
        ...s,
        files: {
          ...s.files,
          [key]: [...(s.files[key] as File[]), ...newFiles],
        },
      }))
    },
    removeMediaFile(key: LocationFileKey, index: number) {
      update((s) => ({
        ...s,
        files: {
          ...s.files,
          [key]: (s.files[key] as File[]).filter((_, i) => i !== index),
        },
      }))
    },
    removeExistingFile(key: LocationFileKey, index: number) {
      update((s) => ({
        ...s,
        existingFiles: {
          ...s.existingFiles,
          [key]: s.existingFiles[key].filter((_, i) => i !== index),
        },
      }))
    },
    setTags: (value: string[]) => update((s) => ({ ...s, tags: value })),
    setPreviewImage: (file: File | null) => update((s) => ({ ...s, previewImage: file })),
    setExistingPreviewUrl: (url: string | null) => update((s) => ({ ...s, existingPreviewUrl: url })),
    setAddress: (value: LocationAddress) => update((s) => ({ ...s, address: value })),
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
      content: { metadata?: LocationMetadataInput; tags?: string[] },
      existingFiles: ExistingFilesByBucket = emptyExistingFiles(),
      existingPreviewUrl: string | null = null,
    ) {
      const metadata = (content.metadata ?? {}) as Record<string, unknown>
      const name = (metadata.name as string) ?? ''
      const description = (metadata.description as string) ?? ''
      const address = (metadata.address as LocationAddress) ?? { street: '', apt: '', city: '', state: '', zip: '' }
      const tags = content.tags ?? (metadata.tags as string[] | undefined) ?? []
      const licensing = (metadata.licensing ?? {}) as Partial<LocationLicensingMetadata>

      update((s) => ({
        ...s,
        name: name ?? '',
        description: description ?? '',
        tags: tags ?? [],
        address: {
          street: address?.street ?? '',
          apt: address?.apt ?? '',
          city: address?.city ?? '',
          state: address?.state ?? '',
          zip: address?.zip ?? '',
        },
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
          locations: [],
        },
        previewImage: null,
        existingPreviewUrl: null,
        name: '',
        description: '',
        tags: [],
        address: { street: '', apt: '', city: '', state: '', zip: '' },
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

export const locationStore = createLocationStore()

export const isFormValid = derived(locationStore, ($s) => {
  const enabledLicenseTypes = Object.entries($s.licensing.licenseTypes).filter(([, enabled]) => enabled)
  const hasLicenseType = enabledLicenseTypes.length > 0

  if ($s.isEditing) {
    return hasLicenseType && $s.licensing.agreedToFee
  }

  const hasValidLicensePrice = enabledLicenseTypes.every(([id]) => Number($s.licensing.licensePrices[id] || 0) >= 0.5)

  return hasLicenseType && hasValidLicensePrice && $s.licensing.agreedToFee
})
