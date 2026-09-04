import { getLicenses, trimString } from '$lib/content/licensing'
import {
  WORK_LICENSE_DESCRIPTIONS,
  LICENSE_TYPE_OPTIONS,
  type WorkContent,
  type WorkDetails,
} from '@repo/content-types/works'
import { getWorkPreviewUrl, WORK_PLACEHOLDER_URL } from '../works'

const LICENSE_NAMES = Object.fromEntries(LICENSE_TYPE_OPTIONS.map(({ value, label }) => [value, label]))
const stringArray = (value: unknown) => (Array.isArray(value) ? value.map(trimString).filter(Boolean) : [])

export function normalizeWork(content: WorkContent, contractAddress: string): WorkDetails | null {
  const metadata = content.metadata
  if (metadata?.type !== 'works') return null
  const title = trimString(metadata.name) || 'Untitled work'
  const sample = trimString(metadata.sample_file_name)

  return {
    id: content.id,
    contentTokenId: trimString(content.tokenId),
    title,
    contentType: trimString(metadata.contentType),
    description: trimString(metadata.description),
    authors: stringArray(metadata.authors),
    genres: stringArray(metadata.genre),
    licenses: getLicenses(metadata.licensing, {
      licenseNames: LICENSE_NAMES,
      licenseDescriptions: WORK_LICENSE_DESCRIPTIONS,
      allowedIds: ['single-use'],
    }),
    image: {
      src: WORK_PLACEHOLDER_URL,
      alt: title,
    },
    sample: sample
      ? {
          filename: sample,
          url: getWorkPreviewUrl(contractAddress, content.id, sample),
        }
      : undefined,
    files: stringArray(metadata.files_name),
  }
}
