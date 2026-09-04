import {
  DOMParser,
  type Document as XmlDocument,
  type Element as XmlElement,
  type Node as XmlNode,
} from '@xmldom/xmldom'
import removeMarkdown from 'remove-markdown'

export const SUPPORTED_TEXT_FILE_EXTENSIONS = ['md', 'txt', 'pdf', 'docx', 'epub'] as const

export type SupportedTextFileExtension = (typeof SUPPORTED_TEXT_FILE_EXTENSIONS)[number]

export type FileTextExtractionErrorCode = 'UNSUPPORTED_FORMAT' | 'READ_FAILED' | 'PARSE_FAILED' | 'EMPTY_CONTENT'

export class FileTextExtractionError extends Error {
  readonly code: FileTextExtractionErrorCode

  constructor(code: FileTextExtractionErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'FileTextExtractionError'
    this.code = code
  }
}

const MIME_TYPE_EXTENSIONS: Readonly<Record<string, SupportedTextFileExtension>> = {
  'application/epub+zip': 'epub',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'text/x-markdown': 'md',
}

const SUPPORTED_EXTENSIONS = new Set<string>(SUPPORTED_TEXT_FILE_EXTENSIONS)

function getFileExtension(file: File): SupportedTextFileExtension {
  const filename = file.name.trim()
  const dotIndex = filename.lastIndexOf('.')

  if (dotIndex >= 0 && dotIndex < filename.length - 1) {
    const extension = filename.slice(dotIndex + 1).toLowerCase()
    if (SUPPORTED_EXTENSIONS.has(extension)) return extension as SupportedTextFileExtension
    throw unsupportedFormat(file)
  }

  const extension = MIME_TYPE_EXTENSIONS[file.type.toLowerCase()]
  if (extension) return extension

  throw unsupportedFormat(file)
}

function unsupportedFormat(file: File) {
  const description = file.name || file.type || 'unknown file'
  return new FileTextExtractionError('UNSUPPORTED_FORMAT', `Unsupported text file format: ${description}`)
}

function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[\t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  try {
    return await file.arrayBuffer()
  } catch (cause) {
    throw new FileTextExtractionError('READ_FAILED', `Could not read ${file.name || 'file'}`, { cause })
  }
}

async function extractPlainText(file: File): Promise<string> {
  try {
    return await file.text()
  } catch (cause) {
    throw new FileTextExtractionError('READ_FAILED', `Could not read ${file.name || 'file'}`, { cause })
  }
}

async function extractMarkdown(file: File): Promise<string> {
  return removeMarkdown(await extractPlainText(file), {
    stripListLeaders: false,
    useImgAltText: true,
  })
}

async function extractPdf(file: File): Promise<string> {
  const data = new Uint8Array(await readArrayBuffer(file))
  const { getDocument } = await import('pdfjs-dist')
  const loadingTask = getDocument({ data })

  try {
    const document = await loadingTask.promise
    const pages: string[] = []

    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()
        let pageText = ''

        for (const item of content.items) {
          if (!('str' in item)) continue
          pageText += item.str
          pageText += item.hasEOL ? '\n' : ' '
        }

        pages.push(pageText)
        page.cleanup()
      }
    } finally {
      await document.cleanup()
    }

    return pages.join('\n\n')
  } finally {
    await loadingTask.destroy()
  }
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await readArrayBuffer(file)
  const result = await mammoth.extractRawText({ arrayBuffer, buffer: new Uint8Array(arrayBuffer) } as Parameters<
    typeof mammoth.extractRawText
  >[0])
  return result.value
}

function resolveArchivePath(basePath: string, relativePath: string): string {
  const decodedPath = decodeURIComponent(relativePath.split('#', 1)[0] ?? '')
  const segments = `${basePath}/${decodedPath}`.split('/')
  const resolved: string[] = []

  for (const segment of segments) {
    if (!segment || segment === '.') continue
    if (segment === '..') resolved.pop()
    else resolved.push(segment)
  }

  return resolved.join('/')
}

function parseXml(xml: string, label: string): XmlDocument {
  const errors: string[] = []
  const document = new DOMParser({
    onError: (level, message) => {
      if (level !== 'warning') errors.push(message)
    },
  }).parseFromString(xml, 'application/xml')

  if (errors.length > 0 || document.getElementsByTagName('parsererror').length > 0) {
    throw new Error(`Invalid ${label}`)
  }

  return document
}

function elementsByLocalName(document: XmlDocument, name: string): XmlElement[] {
  return Array.from(document.getElementsByTagName('*')).filter((element) => element.localName === name)
}

const BLOCK_ELEMENTS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'div',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'li',
  'main',
  'p',
  'pre',
  'section',
  'table',
  'tr',
])

function extractDocumentText(document: XmlDocument): string {
  const output: string[] = []

  const visit = (node: XmlNode) => {
    if (node.nodeType === 3) {
      output.push(node.nodeValue ?? '')
      return
    }
    if (node.nodeType !== 1) return

    const element = node as XmlElement
    const name = (element.localName ?? element.nodeName).toLowerCase()
    if (name === 'script' || name === 'style' || name === 'nav') return

    const isBlock = BLOCK_ELEMENTS.has(name)
    if (isBlock) output.push('\n')
    for (const child of Array.from(node.childNodes)) visit(child)
    if (isBlock && name !== 'br') output.push('\n')
  }

  const body = elementsByLocalName(document, 'body')[0] ?? document.documentElement
  visit(body)
  return output.join('')
}

async function extractEpub(file: File): Promise<string> {
  const { unzipSync, strFromU8 } = await import('fflate')

  const archive = unzipSync(new Uint8Array(await readArrayBuffer(file)))
  const containerEntry = archive['META-INF/container.xml']
  if (!containerEntry) throw new Error('EPUB container.xml is missing')

  const container = parseXml(strFromU8(containerEntry), 'EPUB container')
  const rootfile = elementsByLocalName(container, 'rootfile')[0]
  const packagePath = rootfile?.getAttribute('full-path')
  if (!packagePath) throw new Error('EPUB package path is missing')

  const packageEntry = archive[packagePath]
  if (!packageEntry) throw new Error('EPUB package document is missing')

  const packageDocument = parseXml(strFromU8(packageEntry), 'EPUB package document')
  const manifest = new Map<string, string>()
  for (const item of elementsByLocalName(packageDocument, 'item')) {
    const id = item.getAttribute('id')
    const href = item.getAttribute('href')
    if (id && href) manifest.set(id, href)
  }

  const packageDirectory = packagePath.includes('/') ? packagePath.slice(0, packagePath.lastIndexOf('/')) : ''
  const chapters: string[] = []

  for (const itemref of elementsByLocalName(packageDocument, 'itemref')) {
    const href = manifest.get(itemref.getAttribute('idref') ?? '')
    if (!href) continue

    const chapterPath = resolveArchivePath(packageDirectory, href)
    const chapterEntry = archive[chapterPath]
    if (!chapterEntry) throw new Error(`EPUB chapter is missing: ${chapterPath}`)

    const chapter = parseXml(strFromU8(chapterEntry), `EPUB chapter ${chapterPath}`)
    chapters.push(extractDocumentText(chapter))
  }

  return chapters.join('\n\n')
}

const EXTRACTORS: Record<SupportedTextFileExtension, (file: File) => Promise<string>> = {
  docx: extractDocx,
  epub: extractEpub,
  md: extractMarkdown,
  pdf: extractPdf,
  txt: extractPlainText,
}

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = getFileExtension(file)

  try {
    const text = normalizeText(await EXTRACTORS[extension](file))
    if (!text) {
      throw new FileTextExtractionError('EMPTY_CONTENT', `No text content found in ${file.name || 'file'}`)
    }
    return text
  } catch (cause) {
    if (cause instanceof FileTextExtractionError) throw cause
    throw new FileTextExtractionError('PARSE_FAILED', `Could not parse ${file.name || 'file'} as ${extension}`, {
      cause,
    })
  }
}
