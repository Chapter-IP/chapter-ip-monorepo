import type { Content } from './content'

export type { ContentFile } from './content'

export type WorkLicensingMetadata = {
  licenseTypes: Record<string, boolean>
  licensePrices: Record<string, string>
  permittedUses: Record<string, boolean>
  allowAiTraining: boolean
  attributionRequired: boolean
  canBuyerModify: boolean
  agreedToFee: boolean
}

export type WorkMetadata = {
  type: 'works'
  name: string
  contentType: string
  description: string
  genre?: string[]
  authors?: string[]
  files_name?: string[]
  preview_file_name?: string
  sample_file_name?: string
  licensing: WorkLicensingMetadata
}

export type WorkMetadataInput = Partial<Omit<WorkMetadata, 'type' | 'licensing'>> & {
  type?: string
  licensing?: Partial<WorkLicensingMetadata>
}
export type WorkLicensingMetadataInput = Partial<WorkLicensingMetadata>

export type WorkContent = Content<WorkMetadataInput> & {
  sub: string
  status: string
  contractAddress: string
}

export const WORK_CONTENT_TYPES = ['Script', 'Lyrics'] as const
export const LICENSE_TYPE_OPTIONS = [
  { value: 'single-use', label: 'One-Time License - Single use' },
  { value: 'perpetual', label: 'Lifetime License - Perpetual use' },
] as const

export const WORK_LICENSE_DESCRIPTIONS: Record<string, string> = {
  'single-use': 'A single use at a flat price.',
  perpetual: 'Unlimited use, forever, at a premium price.',
}

export const PERMITTED_USE_OPTIONS = [
  { value: 'print', label: 'Print' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'digital', label: 'Digital' },
  { value: 'ai', label: 'AI' },
  { value: 'film-tv', label: 'TV/Film' },
] as const

export type WorkLicense = {
  id: string
  name: string
  price: string
  description: string
}

export type WorkImage = {
  src: string
  alt: string
}

export type WorkDetails = {
  id: string
  contentTokenId?: string
  title: string
  contentType: string
  description: string
  authors: string[]
  genres: string[]
  licenses: WorkLicense[]
  image: WorkImage
  sample?: {
    filename: string
    url: string
  }
  permittedUses: string[]
  additionalTerms: string[]
  files: string[]
}

export type WorkPurchase = WorkDetails
