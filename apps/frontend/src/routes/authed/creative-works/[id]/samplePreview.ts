export const SAMPLE_PREVIEW_CHARACTER_LIMIT = 1200

export function truncateSamplePreview(text: string, limit = SAMPLE_PREVIEW_CHARACTER_LIMIT): string {
  if (text.length <= limit) return text

  const candidate = text.slice(0, limit + 1)
  const boundary = candidate.search(/\s+\S*$/)
  const truncated = (boundary > 0 ? candidate.slice(0, boundary) : text.slice(0, limit)).trimEnd()

  return `${truncated}…`
}
