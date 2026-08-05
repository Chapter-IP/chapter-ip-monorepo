import { DEFAULT_IMAGE_URL } from '$lib/content/image'
import { r2BaseConfig } from '@repo/fe-services'
import { STATUS } from '@repo/content-types/content'
import {
  ETHNICITY_OPTIONS,
  EYE_COLOR_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HEIGHT_RANGES,
  LICENSE_TYPE_OPTIONS,
  PERMITTED_USE_OPTIONS,
  UNION_OPTIONS,
  WEIGHT_RANGES,
  type LikenessContent,
  type LikenessOption,
  type LikenessOptionValue,
  type LikenessRange,
} from '@repo/content-types/likeness'

export {
  ETHNICITY_OPTIONS,
  EYE_COLOR_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HEIGHT_RANGES,
  LICENSE_TYPE_OPTIONS,
  PERMITTED_USE_OPTIONS,
  UNION_OPTIONS,
  WEIGHT_RANGES,
}

export { DEFAULT_IMAGE_URL }

export const RECENT_LIMIT = 10

type ArrayFilterKey = 'ethnicity' | 'eyeColor' | 'hairColor' | 'union' | 'licenseType' | 'permittedUse'
type EqualityFilterValue = string | number | boolean | null

export type LikenessFilterCondition =
  | { field: string; op: 'eq'; val: EqualityFilterValue }
  | { field: string; op: 'gte' | 'lt'; val: number }
  | { field: string; op: 'regex'; val: string }

export type LikenessFilterNode = LikenessFilterCondition | { and: LikenessFilterNode[] } | { or: LikenessFilterNode[] }

type LikenessFindContentInput = {
  contractAddress: string
  metadata: LikenessFilterNode
  sort: string
  order: 'asc' | 'desc' | undefined
  status: string
}

export type LikenessItem = {
  id: string
  name: string
  bio: string
  description?: string
  imageUrl: string
  metadata?: LikenessContent['metadata']
}

type ContentItem = {
  id: string
  metadata?: LikenessContent['metadata']
}

const SEARCH_FIELDS = ['profile.fullLegalName', 'profile.stageName', 'profile.bio'] as const

const MULTI_FILTER_FIELDS = {
  ethnicity: 'profile.attributes.ethnicity',
  eyeColor: 'profile.attributes.eyeColor',
  hairColor: 'profile.attributes.hairColor',
  union: 'profile.affiliations.union',
  licenseType: 'licensing.licenseTypes',
  permittedUse: 'licensing.permittedUses',
} as const satisfies Record<ArrayFilterKey, string>

const HEIGHT_FILTER_FIELD = 'profile.attributes.heightTotalInches'
const WEIGHT_FILTER_FIELD = 'profile.attributes.weight'
const REGEX_SPECIAL_CHARS = /[\\^$.*+?()[\]{}|]/g

export type LikenessFilters = {
  query: string
  ethnicity: LikenessOptionValue<typeof ETHNICITY_OPTIONS>[]
  eyeColor: LikenessOptionValue<typeof EYE_COLOR_OPTIONS>[]
  hairColor: LikenessOptionValue<typeof HAIR_COLOR_OPTIONS>[]
  union: LikenessOptionValue<typeof UNION_OPTIONS>[]
  licenseType: LikenessOptionValue<typeof LICENSE_TYPE_OPTIONS>[]
  permittedUse: LikenessOptionValue<typeof PERMITTED_USE_OPTIONS>[]
  height: LikenessOptionValue<typeof HEIGHT_RANGES> | null
  weight: LikenessOptionValue<typeof WEIGHT_RANGES> | null
}

function selectedOptionValues<TOptions extends readonly LikenessOption[]>(
  searchParams: URLSearchParams,
  key: ArrayFilterKey,
  options: TOptions,
): LikenessOptionValue<TOptions>[] {
  const allowed = new Set(options.map((option) => option.value))
  return Array.from(
    new Set(searchParams.getAll(key).filter((value) => allowed.has(value))),
  ) as LikenessOptionValue<TOptions>[]
}

function selectedOptionValue<TOptions extends readonly LikenessOption[]>(
  searchParams: URLSearchParams,
  key: string,
  options: TOptions,
): LikenessOptionValue<TOptions> | null {
  const allowed = new Set(options.map((option) => option.value))
  const selected = searchParams.getAll(key).find((value) => allowed.has(value))

  return (selected ?? null) as LikenessOptionValue<TOptions> | null
}

export function getPreviewUrl(contractAddress: string, contentId: string, filename?: string): string {
  if (!filename) return DEFAULT_IMAGE_URL
  return `${r2BaseConfig.previewUrl}/${contractAddress}/${contentId}/${filename}`
}

export function createEmptyLikenessFilters(): LikenessFilters {
  return {
    query: '',
    ethnicity: [],
    eyeColor: [],
    hairColor: [],
    union: [],
    licenseType: [],
    permittedUse: [],
    height: null,
    weight: null,
  }
}

export function parseLikenessFilters(searchParams: URLSearchParams): LikenessFilters {
  return {
    query: searchParams.get('q')?.trim() ?? '',
    ethnicity: selectedOptionValues(searchParams, 'ethnicity', ETHNICITY_OPTIONS),
    eyeColor: selectedOptionValues(searchParams, 'eyeColor', EYE_COLOR_OPTIONS),
    hairColor: selectedOptionValues(searchParams, 'hairColor', HAIR_COLOR_OPTIONS),
    union: selectedOptionValues(searchParams, 'union', UNION_OPTIONS),
    licenseType: selectedOptionValues(searchParams, 'licenseType', LICENSE_TYPE_OPTIONS),
    permittedUse: selectedOptionValues(searchParams, 'permittedUse', PERMITTED_USE_OPTIONS),
    height: selectedOptionValue(searchParams, 'height', HEIGHT_RANGES),
    weight: selectedOptionValue(searchParams, 'weight', WEIGHT_RANGES),
  }
}

export function filtersToSearchParams(filters: LikenessFilters): URLSearchParams {
  const searchParams = new URLSearchParams()

  const appendValues = (key: ArrayFilterKey) => {
    for (const value of filters[key]) searchParams.append(key, value)
  }

  if (filters.query.trim()) searchParams.set('q', filters.query.trim())

  appendValues('ethnicity')
  appendValues('eyeColor')
  appendValues('hairColor')
  appendValues('union')
  appendValues('licenseType')
  appendValues('permittedUse')

  if (filters.height) searchParams.set('height', filters.height)
  if (filters.weight) searchParams.set('weight', filters.weight)

  return searchParams
}

export function getActiveFilterCount(filters: LikenessFilters): number {
  return (
    (filters.query.trim() ? 1 : 0) +
    filters.ethnicity.length +
    filters.eyeColor.length +
    filters.hairColor.length +
    filters.union.length +
    filters.licenseType.length +
    filters.permittedUse.length +
    (filters.height ? 1 : 0) +
    (filters.weight ? 1 : 0)
  )
}

function getSelectedRange<TOptions extends readonly LikenessRange[]>(
  value: LikenessOptionValue<TOptions> | null,
  ranges: TOptions,
): LikenessRange | null {
  return ranges.find((range) => range.value === value) ?? null
}

function equalCondition(field: string, val: EqualityFilterValue): LikenessFilterCondition {
  return { field, op: 'eq', val }
}

function escapeRegex(value: string): string {
  return value.replace(REGEX_SPECIAL_CHARS, '\\$&')
}

function toCaseInsensitiveRegexPattern(value: string): string {
  return Array.from(value)
    .map((char) => {
      const lower = char.toLowerCase()
      const upper = char.toUpperCase()

      if (lower !== upper && /^[a-z]$/i.test(char)) return `[${escapeRegex(lower)}${escapeRegex(upper)}]`

      return escapeRegex(char)
    })
    .join('')
}

function appendMultiFilter(nodes: LikenessFilterNode[], field: string, values: string[]) {
  if (values.length === 0) return
  nodes.push({
    or: values.map((value) => equalCondition(field, value)),
  })
}

function appendBooleanMapFilter(nodes: LikenessFilterNode[], field: string, values: string[]) {
  if (values.length === 0) return
  nodes.push({
    or: values.map((value) => equalCondition(`${field}.${value}`, true)),
  })
}

function appendRangeFilter(nodes: LikenessFilterNode[], field: string, range: LikenessRange | null) {
  if (!range) return
  if (range.min !== null) nodes.push({ field, op: 'gte', val: range.min })
  if (range.max !== null) nodes.push({ field, op: 'lt', val: range.max })
}

function appendSearchFilter(nodes: LikenessFilterNode[], query: string) {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return

  nodes.push({
    or: SEARCH_FIELDS.map((field) => ({ field, op: 'regex', val: toCaseInsensitiveRegexPattern(trimmedQuery) })),
  })
}

export function buildLikenessFilterInput(filters: LikenessFilters): LikenessFilterNode {
  const and: LikenessFilterNode[] = [equalCondition('type', 'likeness')]

  appendSearchFilter(and, filters.query)
  appendMultiFilter(and, MULTI_FILTER_FIELDS.ethnicity, filters.ethnicity)
  appendMultiFilter(and, MULTI_FILTER_FIELDS.eyeColor, filters.eyeColor)
  appendMultiFilter(and, MULTI_FILTER_FIELDS.hairColor, filters.hairColor)
  appendMultiFilter(and, MULTI_FILTER_FIELDS.union, filters.union)
  appendBooleanMapFilter(and, MULTI_FILTER_FIELDS.licenseType, filters.licenseType)
  appendBooleanMapFilter(and, MULTI_FILTER_FIELDS.permittedUse, filters.permittedUse)
  appendRangeFilter(and, HEIGHT_FILTER_FIELD, getSelectedRange(filters.height, HEIGHT_RANGES))
  appendRangeFilter(and, WEIGHT_FILTER_FIELD, getSelectedRange(filters.weight, WEIGHT_RANGES))

  return { and }
}

export function buildLikenessFindContentInput(
  contractAddress: string,
  filters: LikenessFilters = createEmptyLikenessFilters(),
): LikenessFindContentInput {
  return {
    contractAddress,
    metadata: buildLikenessFilterInput(filters),
    sort: 'createdAt',
    order: 'desc',
    status: STATUS.ACTIVE,
  }
}

export function toLikenessItems(contentItems: ContentItem[], contractAddress: string): LikenessItem[] {
  return contentItems.flatMap((item) => {
    const metadata = item.metadata
    if (metadata?.type !== 'likeness') return []

    const profile = metadata.profile
    const name = profile?.fullLegalName ?? ''
    const bio = profile?.bio ?? ''

    return [
      {
        id: item.id,
        name,
        bio,
        description: bio,
        imageUrl: getPreviewUrl(contractAddress, item.id, metadata.uploadsByBucket?.headshots[0] ?? ''),
        metadata,
      },
    ]
  })
}

export function getRecentLikenesses(items: LikenessItem[]): LikenessItem[] {
  return items.slice(0, RECENT_LIMIT)
}
