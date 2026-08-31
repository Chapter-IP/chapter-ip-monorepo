import type { Content } from './content'

export type { ContentFile } from './content'

export type YesNo = 'yes' | 'no' | null

export type LikenessOption = { value: string; label: string }
export type LikenessOptionValue<TOptions extends readonly LikenessOption[]> = TOptions[number]['value']
export type LikenessRange = LikenessOption & { min: number | null; max: number | null }

export const ETHNICITY_OPTIONS = [
  { value: 'hispanic_or_latino', label: 'Hispanic or Latino' },
  { value: 'white_or_caucasian', label: 'White or Caucasian' },
  { value: 'black_or_african_american', label: 'Black or African American' },
  { value: 'native_hawaiian_or_other_pacific_islander', label: 'Native Hawaiian or Other Pacific Islander' },
  { value: 'asian', label: 'Asian' },
  { value: 'american_indian_or_alaska_native', label: 'American Indian or Alaska Native' },
  { value: 'other', label: 'Other (prefer to self-identify)' },
] as const satisfies readonly LikenessOption[]

export const EYE_COLOR_OPTIONS = [
  { value: 'gray', label: 'Gray' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'hazel', label: 'Hazel' },
  { value: 'amber', label: 'Amber' },
  { value: 'brown', label: 'Brown' },
] as const satisfies readonly LikenessOption[]

export const HAIR_COLOR_OPTIONS = [
  { value: 'black', label: 'Black' },
  { value: 'brown', label: 'Brown' },
  { value: 'auburn', label: 'Auburn' },
  { value: 'red', label: 'Red' },
  { value: 'blonde', label: 'Blonde' },
  { value: 'gray', label: 'Gray' },
  { value: 'white', label: 'White' },
] as const satisfies readonly LikenessOption[]

export const UNION_OPTIONS = [
  { value: 'SAG-AFTRA', label: 'SAG-AFTRA' },
  { value: 'AEA', label: 'AEA' },
  { value: 'IATSE', label: 'IATSE' },
  { value: 'AFM', label: 'AFM' },
  { value: 'WGA', label: 'WGA' },
  { value: 'DGA', label: 'DGA' },
] as const satisfies readonly LikenessOption[]

export const LICENSE_TYPE_OPTIONS = [
  { value: 'single-use', label: 'Single-use campaign' },
  // { value: 'time-limited', label: 'Time-limited commercial' },
  { value: 'perpetual', label: 'Perpetual brand ambassador' },
  // { value: 'bulk', label: 'Bulk clean list' },
] as const satisfies readonly LikenessOption[]

export const PERMITTED_USE_OPTIONS = [
  { value: 'ai', label: 'AI Training' },
  { value: 'digital', label: 'Digital' },
  // { value: 'print', label: 'Print' },
  { value: 'commercial', label: 'Marketing' },
  { value: 'film-tv', label: 'Film/TV' },
] as const satisfies readonly LikenessOption[]

export const HEIGHT_RANGES = [
  { value: 'under-5-0', label: 'Under 5\'0"', min: null, max: 60 },
  { value: '5-0-5-4', label: '5\'0" - 5\'4"', min: 60, max: 64 },
  { value: '5-4-5-8', label: '5\'4" - 5\'8"', min: 64, max: 68 },
  { value: '5-8-6-0', label: '5\'8" - 6\'0"', min: 68, max: 72 },
  { value: '6-0-6-4', label: '6\'0" - 6\'4"', min: 72, max: 76 },
  { value: '6-4-6-8', label: '6\'4" - 6\'8"', min: 76, max: 80 },
  { value: 'over-6-8', label: 'Over 6\'8"', min: 80, max: null },
] as const satisfies readonly LikenessRange[]

export const WEIGHT_RANGES = [
  { value: 'under-110', label: 'Under 110 lbs', min: null, max: 110 },
  { value: '110-130', label: '110 - 130 lbs', min: 110, max: 130 },
  { value: '130-155', label: '130 - 155 lbs', min: 130, max: 155 },
  { value: '155-175', label: '155 - 175 lbs', min: 155, max: 175 },
  { value: '175-200', label: '175 - 200 lbs', min: 175, max: 200 },
  { value: '200-220', label: '200 - 220 lbs', min: 200, max: 220 },
  { value: 'over-220', label: 'Over 220 lbs', min: 220, max: null },
] as const satisfies readonly LikenessRange[]

export type LikenessProfileAttributes = {
  ethnicity: string
  heightFt: string
  heightIn: string
  heightTotalInches?: number
  weight: number | null
  eyeColor: string
  hairColor: string
}

export type LikenessProfileAffiliation = {
  union: string
  memberId: string
}

export type LikenessProfileMetadata = {
  fullLegalName: string
  stageName: string
  bio: string
  attributes: LikenessProfileAttributes
  affiliations: LikenessProfileAffiliation[]
}

export type LikenessLicensingMetadata = {
  licenseTypes: Record<string, boolean>
  licensePrices: Record<string, string>
  permittedUses: Record<string, boolean>
  territories: string[]
  allowRetouching: YesNo
  approveFinalUse: YesNo
  agreedToFee: boolean
}

export type LikenessMetadata = {
  type: 'likeness'
  profile: LikenessProfileMetadata
  licensing: LikenessLicensingMetadata
  uploadsByBucket?: Record<string, string[]>
}

export type LikenessProfileMetadataInput = Partial<Omit<LikenessProfileMetadata, 'attributes' | 'affiliations'>> & {
  attributes?: Partial<LikenessProfileAttributes>
  affiliations?: Array<Partial<LikenessProfileAffiliation>>
}

export type LikenessLicensingMetadataInput = Partial<LikenessLicensingMetadata>

export type LikenessMetadataInput = {
  type?: string
  profile?: LikenessProfileMetadataInput
  licensing?: LikenessLicensingMetadataInput
  uploadsByBucket?: Record<string, string[]>
}

export type LikenessContent = Content<LikenessMetadataInput>

export type LikenessAffiliation = {
  union: string
  memberId: string
}

export type LikenessAttribute = {
  label: string
  value: string
}

export type LikenessLicense = {
  id: string
  name: string
  price: string
  description: string
}

export type LikenessImage = {
  src: string
  alt: string
}

export type LikenessMedia =
  | (LikenessImage & {
      id: string
      type: 'image'
    })
  | {
      id: string
      type: 'audio' | 'video' | 'file'
      label: string
    }

export type LikenessDetails = {
  id: string
  contentTokenId?: string
  name: string
  stageName: string
  bio: string
  attributes: LikenessAttribute[]
  affiliations: LikenessAffiliation[]
  licenses: LikenessLicense[]
  permittedUses: string[]
  territories: string[]
  allowRetouching: boolean
  approveFinalUse: boolean
  images: LikenessImage[]
  media: LikenessMedia[]
  files: string[]
}

export type LikenessPurchase = LikenessDetails
