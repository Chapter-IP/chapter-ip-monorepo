import type { Content } from './content'

export type { ContentFile } from './content'

export type WorkLicensingMetadata = {
  licenseTypes: Record<string, boolean>
  licensePrices: Record<string, string>
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
  licensing: WorkLicensingMetadata
}

export type WorkLicensingMetadataInput = Partial<WorkLicensingMetadata>

export type WorkMetadataInput = Partial<Omit<WorkMetadata, 'type' | 'licensing'>> & {
  type?: string
  licensing?: WorkLicensingMetadataInput
}

export type WorkContent = Content<WorkMetadataInput> & {
  sub: string
  status: string
  contractAddress: string
}

export const LICENSE_TYPE_OPTIONS = [{ value: 'single-use', label: 'Single-use license' }] as const

export const WORK_LICENSE_DESCRIPTIONS: Record<string, string> = {
  'single-use':
    'One approved use across a single project. The buyer cannot reuse the work for a separate project, extend the run, or sublicense without purchasing a new license.',
}

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
  authorName: string
  licenses: WorkLicense[]
  image: WorkImage
  files: string[]
}

export type WorkPurchase = WorkDetails
