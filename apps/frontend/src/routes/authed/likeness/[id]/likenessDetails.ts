import { formatLabel, getLicenses, trimString } from '$lib/content/licensing'
import { getPreviewUrl } from '../likeness'
import { LICENSE_TYPE_OPTIONS, PERMITTED_USE_OPTIONS, ETHNICITY_OPTIONS } from '@repo/content-types/likeness'
import type {
  LikenessAffiliation,
  LikenessContent,
  LikenessDetails,
  LikenessLicense,
  LikenessLicensingMetadataInput,
  LikenessProfileAffiliation,
  LikenessProfileAttributes,
} from '@repo/content-types/likeness'

type LikenessContentInput = LikenessContent
type LikenessImageMedia = Extract<LikenessDetails['media'][number], { type: 'image' }>
type PreviewImageBucket = 'headshots' | 'bodyShots'
type PreviewAuxiliaryBucket = 'voiceSamples' | 'videoReels'

const DEFAULT_PREVIEW_IMAGE = 'headshot_1'
const PREVIEW_IMAGE_BUCKETS = ['headshots', 'bodyShots'] as const satisfies readonly PreviewImageBucket[]
const PREVIEW_AUXILIARY_BUCKETS = {
  voiceSamples: 'audio',
  videoReels: 'video',
} as const satisfies Record<PreviewAuxiliaryBucket, 'audio' | 'video'>

const LICENSE_NAMES: Record<string, string> = {
  'time-limited': 'Time-limited commercial',
  'ai-digital': 'AI and digital use',
  bulk: 'Bulk licensing',
  ...Object.fromEntries(LICENSE_TYPE_OPTIONS.map((option) => [option.value, option.label])),
}

const LICENSE_DESCRIPTIONS: Record<string, string> = {
  'single-use':
    'One approved use across a single campaign. Buyer cannot reuse the asset for a separate project, extend the run, or sublicense without purchasing a new license.',
  'time-limited':
    'Commercial use across multiple placements within a defined window. The asset is automatically retired from the buyer’s library when the term ends.',
  perpetual:
    'Ongoing partnership for buyers who want long-term association with your digital likeness. Priced as a recurring fee. End the license at any time to stop all future use.',
}

const PERMITTED_USE_NAMES: Record<string, string> = {
  ...Object.fromEntries(PERMITTED_USE_OPTIONS.map((option) => [option.value, option.label])),
}

function formatHeight(attributes: Partial<LikenessProfileAttributes> | undefined): string {
  const feet = trimString(attributes?.heightFt)
  const inches = trimString(attributes?.heightIn)
  if (!feet && !inches) return ''

  const imperial = [feet && `${feet}'`, inches && `${inches}"`].filter(Boolean).join(' ')
  const totalInches = Number(feet || 0) * 12 + Number(inches || 0)
  if (!Number.isFinite(totalInches) || totalInches <= 0) return imperial

  return `${imperial} (${Math.round(totalInches * 2.54)} cm)`
}

function formatWeight(value: unknown): string {
  const weight = trimString(value)
  if (!weight) return ''

  const pounds = Number(weight)
  if (!Number.isFinite(pounds) || pounds <= 0) return `${weight} lbs`

  return `${weight} lbs (${(pounds * 0.453592).toFixed(1)} kg)`
}

function getAffiliations(affiliations: Array<Partial<LikenessProfileAffiliation>> | undefined): LikenessAffiliation[] {
  return (affiliations ?? []).flatMap((affiliation) => {
    const union = trimString(affiliation.union)
    const memberId = trimString(affiliation.memberId)
    return union || memberId ? [{ union, memberId }] : []
  })
}

function getLikenessLicenses(licensing: LikenessLicensingMetadataInput | undefined): LikenessLicense[] {
  return getLicenses(licensing, {
    licenseNames: LICENSE_NAMES,
    licenseDescriptions: LICENSE_DESCRIPTIONS,
  })
}

function getPermittedUses(permittedUses: Record<string, boolean> | undefined): string[] {
  return Object.entries(permittedUses ?? {}).flatMap(([id, enabled]) =>
    enabled === true ? [PERMITTED_USE_NAMES[id] ?? formatLabel(id)] : [],
  )
}

function getPreviewNames(content: LikenessContentInput, buckets: readonly string[]): string[] {
  return Array.from(
    new Set(
      buckets
        .flatMap((bucket) => content.metadata?.uploadsByBucket?.[bucket] ?? [])
        .map(trimString)
        .filter(Boolean),
    ),
  )
}

function getPreviewImageNames(content: LikenessContentInput): string[] {
  const names = getPreviewNames(content, PREVIEW_IMAGE_BUCKETS)

  return names.length > 0 ? names : [DEFAULT_PREVIEW_IMAGE]
}

function getImageMedia(content: LikenessContentInput, name: string, contractAddress: string): LikenessImageMedia[] {
  return getPreviewImageNames(content).map((filename) => ({
    id: filename,
    type: 'image' as const,
    src: getPreviewUrl(contractAddress, content.id, filename),
    alt: `${name} ${filename}`,
  }))
}

function getAuxiliaryMedia(content: LikenessContentInput): LikenessDetails['media'] {
  return Object.entries(PREVIEW_AUXILIARY_BUCKETS).flatMap(([bucket, type]) =>
    getPreviewNames(content, [bucket]).map((filename) => ({
      id: filename,
      type,
      label: filename,
    })),
  )
}

function getMedia(content: LikenessContentInput, name: string, contractAddress: string): LikenessDetails['media'] {
  const imageMedia = getImageMedia(content, name, contractAddress)
  return [...imageMedia, ...getAuxiliaryMedia(content)]
}

function getImages(content: LikenessContentInput, name: string, contractAddress: string): LikenessDetails['images'] {
  return getImageMedia(content, name, contractAddress).map((item) => ({ src: item.src, alt: item.alt }))
}

export function normalizeLikeness(content: LikenessContentInput, contractAddress: string): LikenessDetails | null {
  const metadata = content.metadata
  if (metadata?.type !== 'likeness') return null

  const profile = metadata.profile
  const attributes = profile?.attributes
  const licensing = metadata.licensing
  const name = trimString(profile?.fullLegalName) || 'Unnamed likeness'
  const media = getMedia(content, name, contractAddress)
  const images = getImages(content, name, contractAddress)

  const likenessFiles: string[] = Object.values(content.metadata?.uploadsByBucket ?? {}).flat()

  return {
    id: content.id,
    contentTokenId: trimString(content.tokenId),
    name,
    stageName: trimString(profile?.stageName),
    bio: trimString(profile?.bio),
    attributes: [
      {
        label: 'Ethnicity',
        value: ETHNICITY_OPTIONS.find((o) => o.value === attributes?.ethnicity)?.label ?? attributes?.ethnicity,
      },
      { label: 'Height', value: formatHeight(attributes) },
      { label: 'Weight', value: formatWeight(attributes?.weight) },
      { label: 'Eye color', value: trimString(attributes?.eyeColor) },
      { label: 'Hair color', value: trimString(attributes?.hairColor) },
    ].filter((attribute) => attribute.value),
    affiliations: getAffiliations(profile?.affiliations),
    licenses: getLikenessLicenses(licensing),
    permittedUses: getPermittedUses(licensing?.permittedUses),
    territories: (licensing?.territories ?? []).map(trimString).filter(Boolean),
    allowRetouching: licensing?.allowRetouching === 'yes',
    approveFinalUse: licensing?.approveFinalUse === 'yes',
    images,
    media,
    files: likenessFiles,
  }
}
