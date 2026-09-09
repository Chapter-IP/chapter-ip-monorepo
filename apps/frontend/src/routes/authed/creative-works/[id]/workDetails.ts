import { formatLabel, getLicenses, trimString } from '$lib/content/licensing'
import {
  WORK_LICENSE_DESCRIPTIONS,
  LICENSE_TYPE_OPTIONS,
  PERMITTED_USE_OPTIONS,
  type WorkContent,
  type WorkDetails,
  type WorkLicensingMetadataInput,
} from '@repo/content-types/works'
import { getWorkPreviewUrl, WORK_PLACEHOLDER_URL } from '../works'

const LICENSE_NAMES = Object.fromEntries(LICENSE_TYPE_OPTIONS.map(({ value, label }) => [value, label]))
const LICENSE_IDS = LICENSE_TYPE_OPTIONS.map(({ value }) => value)
const PERMITTED_USE_NAMES: Record<string, string> = Object.fromEntries(
  PERMITTED_USE_OPTIONS.map(({ value, label }) => [value, label]),
)
const ADDITIONAL_TERMS = [
  { key: 'allowAiTraining', label: 'Allow AI training' },
  { key: 'attributionRequired', label: 'Attribution required' },
  { key: 'canBuyerModify', label: 'Can buyer modify' },
] as const
const stringArray = (value: unknown) => (Array.isArray(value) ? value.map(trimString).filter(Boolean) : [])

function getPermittedUses(permittedUses: Record<string, boolean> | undefined): string[] {
  return Object.entries(permittedUses ?? {}).flatMap(([id, enabled]) =>
    enabled === true ? [PERMITTED_USE_NAMES[id] ?? formatLabel(id)] : [],
  )
}

function getAdditionalTerms(licensing: WorkLicensingMetadataInput | undefined): string[] {
  return ADDITIONAL_TERMS.flatMap(({ key, label }) => (licensing?.[key] === true ? [label] : []))
}

export function normalizeWork(content: WorkContent, contractAddress: string): WorkDetails | null {
  const metadata = content.metadata
  if (metadata?.type !== 'works') return null
  const title = trimString(metadata.name) || 'Untitled work'
  const previewImage = trimString(metadata.preview_file_name)
  const previewFiles = stringArray(metadata.preview_files_name)
  const sample = typeof metadata.sample_file_name === 'string' ? trimString(metadata.sample_file_name) : previewFiles[0]

  return {
    id: content.id,
    contentTokenId: trimString(content.tokenId),
    title,
    contentType: trimString(metadata.contentType),
    description: trimString(metadata.description),
    authors: stringArray(metadata.authors),
    genres: stringArray(metadata.genre),
    sampleText: trimString(metadata.sample_text),
    licenses: getLicenses(metadata.licensing, {
      licenseNames: LICENSE_NAMES,
      licenseDescriptions: WORK_LICENSE_DESCRIPTIONS,
      allowedIds: LICENSE_IDS,
    }),
    image: {
      src: previewImage ? getWorkPreviewUrl(contractAddress, content.id, previewImage) : WORK_PLACEHOLDER_URL,
      alt: title,
    },
    sample: sample
      ? {
          filename: sample,
          url: getWorkPreviewUrl(contractAddress, content.id, sample),
        }
      : undefined,
    permittedUses: getPermittedUses(metadata.licensing?.permittedUses),
    additionalTerms: getAdditionalTerms(metadata.licensing),
    files: stringArray(metadata.files_name),
  }
}
