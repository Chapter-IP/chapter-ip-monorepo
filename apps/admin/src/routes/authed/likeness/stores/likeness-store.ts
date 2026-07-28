import { writable, derived } from 'svelte/store'
import type { UploadProgressEvent } from '$lib/upload/upload.service'
import type { AppRouter, TRPCClient } from '@repo/trpc/client'
import { LIKENESS_FILE_BUCKETS, type MultipleFileKey } from '$lib/constants/likenessFileBuckets'
import type {
  LikenessLicensingMetadata,
  LikenessMetadata,
  LikenessMetadataInput,
  LikenessProfileMetadata,
  YesNo,
} from '@repo/content-types/likeness'

export type ExistingFile = { id: string; name: string; url: string }
export type ExistingFilesByBucket = Record<MultipleFileKey, ExistingFile[]>
type LikenessProfileAttributeKey = keyof LikenessState['profile']['attributes']

const emptyExistingFiles = (): ExistingFilesByBucket => ({
  headshots: [],
  bodyShots: [],
  voiceSamples: [],
  videoReels: [],
})

const stripExtension = (name: string) => {
  const lastDot = name.lastIndexOf('.')
  return lastDot === -1 ? name : name.slice(0, lastDot)
}

const namesMatch = (a: string, b: string) => a === b || stripExtension(a) === stripExtension(b)

export const isPreviewBucket = (bucket?: string) => Boolean(bucket?.includes('preview'))

function resolveBucket(
  filename: string,
  uploadsByBucket: LikenessMetadata['uploadsByBucket'] = {},
): MultipleFileKey | null {
  const bucket = LIKENESS_FILE_BUCKETS.find((bucket) =>
    uploadsByBucket[bucket]?.some((name) => namesMatch(name, filename)),
  )
  if (bucket) return bucket

  return null
}

export function getHeightTotalInches(
  attributes: Pick<LikenessProfileMetadata['attributes'], 'heightFt' | 'heightIn'>,
): number | undefined {
  const feetValue = attributes.heightFt
  const inchesValue = attributes.heightIn
  if (!feetValue || !inchesValue) return undefined

  const feet = Number(feetValue)
  const inches = Number(inchesValue)
  if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0 || inches > 11) return undefined

  return feet * 12 + inches
}

export function getNormalizedWeight(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  const weight = Number(value)
  return Number.isFinite(weight) && weight > 0 ? weight : null
}

export async function loadExistingFiles(
  content: { id: string; metadata?: LikenessMetadataInput },
  trpcClient: TRPCClient<AppRouter>,
): Promise<ExistingFilesByBucket> {
  const existingFiles = emptyExistingFiles()
  const uploadsByBucket = content.metadata?.uploadsByBucket ?? {}

  if (!content.id) return existingFiles

  const { files } = await trpcClient.contents.getContentAllFilesLink.query({ contentId: content.id })

  for (const file of files ?? []) {
    if (isPreviewBucket(file.bucket)) continue

    const filename = file.label
    const bucket = resolveBucket(filename, uploadsByBucket)
    if (!bucket) continue

    existingFiles[bucket].push({ id: file.id, name: filename, url: file.url })
  }

  return existingFiles
}

interface LikenessState {
  files: {
    headshots: File[] // multiple
    bodyShots: File[] // multiple
    voiceSamples: File[] // multiple
    videoReels: File[] // multiple
  }
  profile: LikenessProfileMetadata
  licensing: LikenessLicensingMetadata
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

function createLikenessStore() {
  const { subscribe, set, update } = writable<LikenessState>({
    files: {
      headshots: [],
      bodyShots: [],
      voiceSamples: [],
      videoReels: [],
    },
    profile: {
      fullLegalName: '',
      stageName: '',
      bio: '',
      attributes: {
        ethnicity: '',
        heightFt: '',
        heightIn: '',
        weight: null,
        eyeColor: '',
        hairColor: '',
      },
      affiliations: [{ union: '', memberId: '' }],
    },
    licensing: {
      licenseTypes: {
        'single-use': true,
        'time-limited': false,
        perpetual: false,
        'ai-digital': false,
        bulk: false,
      },
      licensePrices: {
        'single-use': '',
        'time-limited': '',
        perpetual: '',
        'ai-digital': '',
        bulk: '',
      },
      permittedUses: {},
      territories: ['United States only'],
      allowRetouching: null,
      approveFinalUse: null,
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
    appendMediaFiles(key: MultipleFileKey, newFiles: File[]) {
      update((s) => ({
        ...s,
        files: {
          ...s.files,
          [key]: [...(s.files[key] as File[]), ...newFiles],
        },
      }))
    },
    removeMediaFile(key: MultipleFileKey, index: number) {
      update((s) => ({
        ...s,
        files: {
          ...s.files,
          [key]: (s.files[key] as File[]).filter((_, i) => i !== index),
        },
      }))
    },
    removeExistingFile(key: MultipleFileKey, index: number) {
      update((s) => ({
        ...s,
        existingFiles: {
          ...s.existingFiles,
          [key]: s.existingFiles[key].filter((_, i) => i !== index),
        },
      }))
    },
    setFullLegalName: (value: string) => update((s) => ({ ...s, profile: { ...s.profile, fullLegalName: value } })),
    setStageName: (value: string) => update((s) => ({ ...s, profile: { ...s.profile, stageName: value } })),
    setBio: (value: string) => update((s) => ({ ...s, profile: { ...s.profile, bio: value } })),
    setAttribute: <TKey extends LikenessProfileAttributeKey>(
      key: TKey,
      value: LikenessState['profile']['attributes'][TKey],
    ) =>
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          attributes: { ...s.profile.attributes, [key]: value },
        },
      })),
    addAffiliation: () =>
      update((s) => ({
        ...s,
        profile: { ...s.profile, affiliations: [...s.profile.affiliations, { union: '', memberId: '' }] },
      })),
    removeAffiliation: (index: number) =>
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          affiliations: s.profile.affiliations.filter((_, i) => i !== index),
        },
      })),
    updateAffiliation: (index: number, key: 'union' | 'memberId', value: string) =>
      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          affiliations: s.profile.affiliations.map((a, i) => (i === index ? { ...a, [key]: value } : a)),
        },
      })),
    setLicenseTypeEnabled: (id: string, value: boolean) =>
      update((s) => {
        const nextLicensing = {
          ...s.licensing,
          licenseTypes: { ...s.licensing.licenseTypes, [id]: value },
          licensePrices: { ...s.licensing.licensePrices, [id]: value ? s.licensing.licensePrices[id] : '' },
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
    setPermittedUse: (id: string, value: boolean) =>
      update((s) => ({
        ...s,
        licensing: { ...s.licensing, permittedUses: { ...s.licensing.permittedUses, [id]: value } },
      })),
    setAllPermittedUses: (ids: string[], value: boolean) =>
      update((s) => ({
        ...s,
        licensing: { ...s.licensing, permittedUses: Object.fromEntries(ids.map((id) => [id, value])) },
      })),
    setTerritories: (territories: string[]) => update((s) => ({ ...s, licensing: { ...s.licensing, territories } })),
    setAllowRetouching: (value: YesNo) =>
      update((s) => ({ ...s, licensing: { ...s.licensing, allowRetouching: value } })),
    setApproveFinalUse: (value: YesNo) =>
      update((s) => ({ ...s, licensing: { ...s.licensing, approveFinalUse: value } })),
    setAgreedToFee: (value: boolean) => update((s) => ({ ...s, licensing: { ...s.licensing, agreedToFee: value } })),
    setRightsConfirmed: (value: boolean) =>
      update((s) => ({ ...s, confirmations: { ...s.confirmations, rightsConfirmed: value } })),
    setLoading: (loading: boolean) => update((s) => ({ ...s, ui: { ...s.ui, loading } })),
    setUploadProgress: (uploadProgress: UploadProgressEvent) =>
      update((s) => ({ ...s, ui: { ...s.ui, uploadProgress } })),
    clearUploadProgress: () => update((s) => ({ ...s, ui: { ...s.ui, uploadProgress: null } })),
    hydrateFromContent(
      content: { metadata?: LikenessMetadataInput },
      existingFiles: ExistingFilesByBucket = emptyExistingFiles(),
    ) {
      const metadata = content.metadata ?? {}
      const profile = (metadata.profile ?? {}) as Partial<LikenessProfileMetadata>
      const licensing = (metadata.licensing ?? {}) as Partial<LikenessLicensingMetadata>

      update((s) => ({
        ...s,
        profile: {
          ...s.profile,
          ...profile,
          attributes: {
            ...s.profile.attributes,
            ...(profile.attributes ?? {}),
            weight: getNormalizedWeight(profile.attributes?.weight ?? s.profile.attributes.weight),
          },
          affiliations: profile.affiliations?.length ? profile.affiliations : s.profile.affiliations,
        },
        licensing: {
          ...s.licensing,
          ...licensing,
          licenseTypes: { ...s.licensing.licenseTypes, ...(licensing.licenseTypes ?? {}) },
          licensePrices: { ...s.licensing.licensePrices, ...(licensing.licensePrices ?? {}) },
          permittedUses: { ...s.licensing.permittedUses, ...(licensing.permittedUses ?? {}) },
        },
        confirmations: { rightsConfirmed: true },
        existingFiles,
        isEditing: Object.values(existingFiles).some((files) => files.length > 0),
      }))
    },
    reset: () =>
      set({
        files: {
          headshots: [],
          bodyShots: [],
          voiceSamples: [],
          videoReels: [],
        },
        profile: {
          fullLegalName: '',
          stageName: '',
          bio: '',
          attributes: {
            ethnicity: '',
            heightFt: '',
            heightIn: '',
            weight: null,
            eyeColor: '',
            hairColor: '',
          },
          affiliations: [{ union: '', memberId: '' }],
        },
        licensing: {
          licenseTypes: {
            'single-use': true,
            'time-limited': false,
            perpetual: false,
            'ai-digital': false,
            bulk: false,
          },
          licensePrices: {
            'single-use': '',
            'time-limited': '',
            perpetual: '',
            'ai-digital': '',
            bulk: '',
          },
          permittedUses: {},
          territories: ['United States only'],
          allowRetouching: null,
          approveFinalUse: null,
          agreedToFee: false,
        },
        confirmations: { rightsConfirmed: false },
        existingFiles: emptyExistingFiles(),
        isEditing: false,
        ui: { loading: false, uploadProgress: null },
      }),
  }
}

export const likenessStore = createLikenessStore()

export const isFormValid = derived(likenessStore, ($s) => {
  const enabledLicenseTypes = Object.entries($s.licensing.licenseTypes).filter(([, enabled]) => enabled)
  const hasLicenseType = enabledLicenseTypes.length > 0
  const hasHeadshots = $s.files.headshots.length > 0 || $s.existingFiles.headshots.length > 0

  if ($s.isEditing) {
    return hasHeadshots && hasLicenseType
  }

  const hasValidLicensePrice = enabledLicenseTypes.every(([id]) => Number($s.licensing.licensePrices[id] || 0) >= 0.5)
  const hasPermittedUse = Object.values($s.licensing.permittedUses).some(Boolean)

  return (
    hasLicenseType &&
    hasValidLicensePrice &&
    hasPermittedUse &&
    $s.licensing.territories.length > 0 &&
    $s.licensing.allowRetouching !== null &&
    $s.licensing.approveFinalUse !== null &&
    $s.licensing.agreedToFee
  )
})
