import { describe, expect, it } from 'vitest'
import { SAMPLE_PREVIEW_CHARACTER_LIMIT, truncateSamplePreview } from './samplePreview'

describe('sample preview', () => {
  it('returns short text unchanged, including line breaks', () => {
    expect(truncateSamplePreview('Verse one\n\nVerse two')).toBe('Verse one\n\nVerse two')
  })

  it('truncates long text at a word boundary', () => {
    const prefix = 'word '.repeat(239)
    const result = truncateSamplePreview(`${prefix}ending followed-by-hidden-text`)

    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(SAMPLE_PREVIEW_CHARACTER_LIMIT + 1)
    expect(result).not.toContain('followed-by-hidden-text')
  })

  it('falls back to a hard boundary when text has no whitespace', () => {
    expect(truncateSamplePreview('x'.repeat(20), 10)).toBe(`${'x'.repeat(10)}…`)
  })
})
