import { strToU8, zipSync } from 'fflate'

const utf8 = (value: string) => strToU8(value)

export function textFixture(name = 'sample.txt', type = 'text/plain'): File {
  return new File(['First paragraph — Zażółć.\r\n\r\nSecond paragraph.'], name, { type })
}

export function markdownFixture(name = 'sample.md', type = 'text/markdown'): File {
  return new File(
    ['# Sample title\n\nFirst **paragraph** — Zażółć.\n\nSecond paragraph with [a link](https://example.com).'],
    name,
    { type },
  )
}

export function docxFixture(name = 'sample.docx'): File {
  const archive = zipSync({
    '[Content_Types].xml': utf8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>',
    ),
    '_rels/.rels': utf8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>',
    ),
    'word/document.xml': utf8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
        '<w:p><w:r><w:t>First paragraph — Zażółć.</w:t></w:r></w:p>' +
        '<w:p><w:r><w:t>Second paragraph.</w:t></w:r></w:p>' +
        '</w:body></w:document>',
    ),
  })

  return new File([archive], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

export function epubFixture(name = 'sample.epub'): File {
  const archive = zipSync({
    mimetype: utf8('application/epub+zip'),
    'META-INF/container.xml': utf8(
      '<?xml version="1.0"?>' +
        '<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">' +
        '<rootfiles><rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>' +
        '</container>',
    ),
    'OPS/content.opf': utf8(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<package xmlns="http://www.idpf.org/2007/opf" version="3.0">' +
        '<manifest>' +
        '<item id="chapter-two" href="chapters/two.xhtml" media-type="application/xhtml+xml"/>' +
        '<item id="chapter-one" href="chapters/one.xhtml" media-type="application/xhtml+xml"/>' +
        '</manifest>' +
        '<spine><itemref idref="chapter-one"/><itemref idref="chapter-two"/></spine>' +
        '</package>',
    ),
    'OPS/chapters/one.xhtml': utf8(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>One</title><style>hidden</style></head>' +
        '<body><h1>First chapter</h1><p>First paragraph — Zażółć.</p></body></html>',
    ),
    'OPS/chapters/two.xhtml': utf8(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Second chapter</h1><p>Second paragraph.</p></body></html>',
    ),
  })

  return new File([archive], name, { type: 'application/epub+zip' })
}

function pdfObject(id: number, body: string): string {
  return `${id} 0 obj\n${body}\nendobj\n`
}

export function pdfFixture(name = 'sample.pdf'): File {
  const firstStream = 'BT /F1 12 Tf 72 720 Td (First page paragraph.) Tj ET'
  const secondStream = 'BT /F1 12 Tf 72 720 Td (Second page paragraph.) Tj ET'
  const objects = [
    pdfObject(1, '<< /Type /Catalog /Pages 2 0 R >>'),
    pdfObject(2, '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>'),
    pdfObject(
      3,
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>',
    ),
    pdfObject(
      4,
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>',
    ),
    pdfObject(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
    pdfObject(6, `<< /Length ${firstStream.length} >>\nstream\n${firstStream}\nendstream`),
    pdfObject(7, `<< /Length ${secondStream.length} >>\nstream\n${secondStream}\nendstream`),
  ]

  let source = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(source.length)
    source += object
  }

  const xrefOffset = source.length
  source += `xref\n0 ${objects.length + 1}\n`
  source += '0000000000 65535 f \n'
  source += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`)
    .join('')
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return new File([source], name, { type: 'application/pdf' })
}
