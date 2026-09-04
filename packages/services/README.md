# @repo/fe-services

Shared frontend services for Chapter IP applications.

## Extract text from a file

`extractTextFromFile` extracts normalized plain text from MD, TXT, PDF, DOCX, and EPUB files.

```ts
import { extractTextFromFile } from '@repo/fe-services'

const text = await extractTextFromFile(file)
```

For a file downloaded from R2, preserve its original filename when converting the response to a `File`:

```ts
import { extractTextFromFile } from '@repo/fe-services'

const response = await fetch(fileUrl)
const blob = await response.blob()
const file = new File([blob], originalFilename, { type: blob.type })
const text = await extractTextFromFile(file)
```

Extraction failures are exposed as `FileTextExtractionError` with one of these codes:

- `UNSUPPORTED_FORMAT`
- `READ_FAILED`
- `PARSE_FAILED`
- `EMPTY_CONTENT`

Scanned PDFs require OCR and return `EMPTY_CONTENT` when they do not contain a text layer. Password-protected files and DRM-protected EPUBs are not supported.
