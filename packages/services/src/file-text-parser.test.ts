import { describe, expect, it, vi } from 'vitest'
import { FileTextExtractionError, SUPPORTED_TEXT_FILE_EXTENSIONS, extractTextFromFile } from './file-text-parser'
import { docxFixture, epubFixture, markdownFixture, pdfFixture, textFixture } from './file-text-parser.fixtures'

describe('extractTextFromFile', () => {
  it('exports the supported formats', () => {
    expect(SUPPORTED_TEXT_FILE_EXTENSIONS).toEqual(['md', 'txt', 'pdf', 'docx', 'epub'])
  })

  it('normalizes plain text while preserving paragraphs and Unicode', async () => {
    await expect(extractTextFromFile(textFixture())).resolves.toBe('First paragraph — Zażółć.\n\nSecond paragraph.')
  })

  it('uses the MIME type when the filename has no extension', async () => {
    await expect(extractTextFromFile(textFixture('README'))).resolves.toContain('First paragraph')
  })

  it('accepts uppercase extensions', async () => {
    await expect(extractTextFromFile(textFixture('SAMPLE.TXT', 'application/octet-stream'))).resolves.toContain(
      'Second paragraph.',
    )
  })

  it('removes Markdown syntax but keeps visible content', async () => {
    await expect(extractTextFromFile(markdownFixture())).resolves.toBe(
      'Sample title\n\nFirst paragraph — Zażółć.\n\nSecond paragraph with a link.',
    )
  })

  it('extracts DOCX paragraphs', async () => {
    await expect(extractTextFromFile(docxFixture())).resolves.toBe('First paragraph — Zażółć.\n\nSecond paragraph.')
  })

  it('extracts PDF pages in order and preserves their boundary', async () => {
    await expect(extractTextFromFile(pdfFixture())).resolves.toBe('First page paragraph.\n\nSecond page paragraph.')
  })

  it('extracts EPUB chapters in spine order', async () => {
    await expect(extractTextFromFile(epubFixture())).resolves.toBe(
      'First chapter\n\nFirst paragraph — Zażółć.\n\nSecond chapter\n\nSecond paragraph.',
    )
  })

  it('rejects an unsupported extension even if the MIME type is supported', async () => {
    const promise = extractTextFromFile(textFixture('sample.rtf'))
    await expect(promise).rejects.toMatchObject({ code: 'UNSUPPORTED_FORMAT' })
  })

  it('reports empty extracted content', async () => {
    const promise = extractTextFromFile(new File([' \n\n '], 'empty.txt', { type: 'text/plain' }))
    await expect(promise).rejects.toMatchObject({ code: 'EMPTY_CONTENT' })
  })

  it.each([
    ['pdf', 'application/pdf'],
    ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['epub', 'application/epub+zip'],
  ])('reports malformed %s content', async (extension, type) => {
    const promise = extractTextFromFile(new File(['not a valid archive'], `broken.${extension}`, { type }))
    await expect(promise).rejects.toMatchObject({ code: 'PARSE_FAILED' })
  })

  it('reports file read failures without converting them to parse failures', async () => {
    const file = textFixture()
    Object.defineProperty(file, 'text', { value: vi.fn().mockRejectedValue(new Error('read failed')) })

    try {
      await extractTextFromFile(file)
      expect.fail('Expected extraction to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(FileTextExtractionError)
      expect(error).toMatchObject({ code: 'READ_FAILED' })
    }
  })
})
