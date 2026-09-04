import placeholderUrl from '$lib/assets/creative-work-placeholder.svg'
import { r2BaseConfig } from '@repo/fe-services'
import { STATUS } from '@repo/content-types/content'
import type { WorkContent } from '@repo/content-types/works'

export const WORK_PLACEHOLDER_URL = placeholderUrl
export const RECENT_WORKS_LIMIT = 10

type EqualityValue = string | number | boolean | null
export type WorkFilterNode =
  | { field: string; op: 'eq'; val: EqualityValue }
  | { field: string; op: 'regex'; val: string }
  | { and: WorkFilterNode[] }
  | { or: WorkFilterNode[] }

export type WorkFilters = { query: string }
export type WorkItem = {
  id: string
  title: string
  contentType: string
  description: string
  authors: string[]
  genres: string[]
  imageUrl: string
  metadata?: WorkContent['metadata']
}

type ContentItem = { id: string; metadata?: WorkContent['metadata'] }
const SEARCH_FIELDS = ['name', 'description', 'contentType', 'genre', 'authors'] as const
const REGEX_SPECIAL_CHARS = /[\\^$.*+?()[\]{}|]/g

export function getWorkPreviewUrl(contractAddress: string, contentId: string, filename: string): string {
  return `${r2BaseConfig.previewUrl}/${contractAddress}/${contentId}/${filename}`
}

export function createEmptyWorkFilters(): WorkFilters {
  return { query: '' }
}

export function parseWorkFilters(searchParams: URLSearchParams): WorkFilters {
  return { query: searchParams.get('q')?.trim() ?? '' }
}

function escapeRegex(value: string): string {
  return value.replace(REGEX_SPECIAL_CHARS, '\\$&')
}

function caseInsensitivePattern(value: string): string {
  return Array.from(value)
    .map((char) => {
      const lower = char.toLowerCase()
      const upper = char.toUpperCase()
      return lower !== upper && /^[a-z]$/i.test(char)
        ? `[${escapeRegex(lower)}${escapeRegex(upper)}]`
        : escapeRegex(char)
    })
    .join('')
}

export function buildWorkFilterInput(filters: WorkFilters): WorkFilterNode {
  const and: WorkFilterNode[] = [{ field: 'type', op: 'eq', val: 'works' }]
  const query = filters.query.trim()
  if (query) {
    and.push({
      or: SEARCH_FIELDS.map((field) => ({ field, op: 'regex', val: caseInsensitivePattern(query) })),
    })
  }
  return { and }
}

export function buildWorkFindContentInput(contractAddress: string, filters = createEmptyWorkFilters()) {
  return {
    contractAddress,
    metadata: buildWorkFilterInput(filters),
    sort: 'createdAt',
    order: 'desc' as const,
    status: STATUS.ACTIVE,
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : []
}

export function toWorkItems(contentItems: ContentItem[], contractAddress: string): WorkItem[] {
  return contentItems.flatMap((item) => {
    const metadata = item.metadata
    if (metadata?.type !== 'works') return []
    const preview = metadata.preview_file_name?.trim()
    return [
      {
        id: item.id,
        title: metadata.name?.trim() ?? '',
        contentType: metadata.contentType?.trim() ?? '',
        description: metadata.description?.trim() ?? '',
        authors: stringArray(metadata.authors),
        genres: stringArray(metadata.genre),
        imageUrl: preview ? getWorkPreviewUrl(contractAddress, item.id, preview) : WORK_PLACEHOLDER_URL,
        metadata,
      },
    ]
  })
}

export function getRecentWorks(items: WorkItem[]): WorkItem[] {
  return items.slice(0, RECENT_WORKS_LIMIT)
}
