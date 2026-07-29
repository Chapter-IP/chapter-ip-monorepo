import type { Content } from './content'

export type LocationLicensingMetadata = {
  licenseTypes: Record<string, boolean>
  licensePrices: Record<string, string>
  agreedToFee: boolean
}

export type LocationAddress = {
  street: string
  apt: string
  city: string
  state: string
  zip: string
}

export type LocationMetadata = {
  type: 'location'
  name: string
  description: string
  files_name?: string[]
  preview_file_name?: string
  licensing: LocationLicensingMetadata
  address?: LocationAddress
}

export type LocationLicensingMetadataInput = Partial<LocationLicensingMetadata>

export type LocationMetadataInput = Partial<Omit<LocationMetadata, 'type' | 'licensing'>> & {
  type?: string
  licensing?: LocationLicensingMetadataInput
}

export type LocationContent = Content<LocationMetadataInput> & {
  sub: string
  status: string
  contractAddress: string
}

export const LICENSE_TYPE_OPTIONS = [{ value: 'single-use', label: 'One-time license' }] as const

export const LOCATION_LICENSE_DESCRIPTIONS: Record<string, string> = {
  'single-use': 'Clears this location for a single project. One use, one payment — no ongoing rights.',
}

export type LocationLicense = {
  id: string
  name: string
  price: string
  description: string
}

export type LocationImage = {
  src: string
  alt: string
}

export type LocationDetails = {
  id: string
  contentTokenId?: string
  name: string
  description: string
  address?: LocationAddress
  tags: string[]
  authorName: string
  licenses: LocationLicense[]
  image: LocationImage
  files: string[]
}

export type LocationPurchase = LocationDetails
