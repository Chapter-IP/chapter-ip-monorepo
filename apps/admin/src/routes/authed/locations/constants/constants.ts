import { LICENSE_TYPE_OPTIONS, LOCATION_LICENSE_DESCRIPTIONS } from '@repo/content-types/location'
export { STATUS, type StatusValue } from '@repo/content-types/content'

type LicenseTypeOption = {
  id: string
  label: string
  description: string
}

export const LICENSE_TYPES: LicenseTypeOption[] = LICENSE_TYPE_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label,
  description: LOCATION_LICENSE_DESCRIPTIONS[option.value] ?? '',
}))
