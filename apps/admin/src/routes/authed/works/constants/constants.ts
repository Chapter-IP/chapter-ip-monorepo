import { LICENSE_TYPE_OPTIONS, WORK_LICENSE_DESCRIPTIONS } from '@repo/content-types/works'
export { STATUS, type StatusValue } from '@repo/content-types/content'

type LicenseTypeOption = {
  id: string
  label: string
  description: string
}

export const LICENSE_TYPES: LicenseTypeOption[] = LICENSE_TYPE_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label,
  description: WORK_LICENSE_DESCRIPTIONS[option.value] ?? '',
}))

export const WORK_CONTENT_TYPES = ['Script', 'Article', 'Novel', 'Poem'] as const
