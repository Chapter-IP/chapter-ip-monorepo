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

export const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
]
