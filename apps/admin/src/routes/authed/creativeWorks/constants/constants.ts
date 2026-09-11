import { LICENSE_TYPE_OPTIONS, PERMITTED_USE_OPTIONS, WORK_LICENSE_DESCRIPTIONS } from '@repo/content-types/works'
import type { LicenseType } from '$lib/types/licensing'
export { STATUS, type StatusValue } from '@repo/content-types/content'

export const LICENSE_TYPES: LicenseType[] = [...LICENSE_TYPE_OPTIONS]
  .sort((a, b) => Number(b.value === 'perpetual') - Number(a.value === 'perpetual'))
  .map((option) => ({
    id: option.value,
    label: option.label,
    description: WORK_LICENSE_DESCRIPTIONS[option.value] ?? '',
  }))

export const PERMITTED_USES = PERMITTED_USE_OPTIONS.map((option) => ({
  id: option.value,
  label: option.label,
}))

export const ADDITIONAL_TERMS = [
  {
    key: 'allowAiTraining',
    label: 'Allow AI training',
    description: '',
  },
  {
    key: 'attributionRequired',
    label: 'Attribution required?',
    description: '',
  },
  {
    key: 'canBuyerModify',
    label: 'Can buyer modify?',
    description: '',
  },
] as const

export const WORK_CONTENT_TYPES = ['Script', 'Lyrics'] as const

export const GENRE_OPTIONS = [
  'Comedy',
  'Fiction',
  'Horror',
  'Memoir',
  'Mystery',
  'Non-fiction',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Young Adult',
] as const

export const SCRIPT_FILE_EXTENSIONS = ['pdf', 'docx', 'txt', 'epub', 'md'] as const
