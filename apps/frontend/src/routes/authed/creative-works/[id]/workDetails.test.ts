import { describe, expect, it } from 'vitest'
import { normalizeWork } from './workDetails'
import { WORK_PLACEHOLDER_URL } from '../works'

describe('creative work detail normalizer', () => {
  it('normalizes Script metadata, both licenses, and the sample file', () => {
    const work = normalizeWork(
      {
        id: 'work-1',
        tokenId: '42',
        sub: 'author',
        status: 'ACTIVE',
        contractAddress: '0xcontent',
        metadata: {
          type: 'works',
          name: ' Pendulum ',
          contentType: 'Script',
          description: ' Story ',
          authors: [' Chadwick Bowser '],
          genre: [' Thriller '],
          files_name: ['pendulum.pdf'],
          preview_file_name: 'cover.jpg',
          sample_file_name: 'sample.pdf',
          licensing: {
            licenseTypes: { 'single-use': true, perpetual: true },
            licensePrices: { 'single-use': '25', perpetual: '100' },
            permittedUses: { print: true, digital: false, 'film-tv': true, custom: true },
            allowAiTraining: true,
            attributionRequired: true,
            canBuyerModify: false,
            agreedToFee: true,
          },
        },
      },
      '0xcontent',
    )
    expect(work).toMatchObject({
      id: 'work-1',
      contentTokenId: '42',
      title: 'Pendulum',
      contentType: 'Script',
      description: 'Story',
      authors: ['Chadwick Bowser'],
      genres: ['Thriller'],
      files: ['pendulum.pdf'],
      image: { src: 'https://preview-files-staging.chapterip.com/0xcontent/work-1/cover.jpg' },
      sample: {
        filename: 'sample.pdf',
        url: 'https://preview-files-staging.chapterip.com/0xcontent/work-1/sample.pdf',
      },
      licenses: [
        { id: 'single-use', name: 'One-Time License - Single use', price: '25' },
        { id: 'perpetual', name: 'Lifetime License - Perpetual use', price: '100' },
      ],
      permittedUses: ['Print', 'TV/Film', 'Custom'],
      additionalTerms: ['Allow AI training', 'Attribution required'],
    })
  })

  it('keeps legacy listings usable without optional marketplace metadata', () => {
    const work = normalizeWork(
      {
        id: 'legacy-work',
        sub: 'author',
        status: 'ACTIVE',
        contractAddress: '0xcontent',
        metadata: { type: 'works', licensing: {} },
      },
      '0xcontent',
    )

    expect(work).toMatchObject({
      title: 'Untitled work',
      contentType: '',
      description: '',
      authors: [],
      genres: [],
      image: { src: WORK_PLACEHOLDER_URL },
      files: [],
      permittedUses: [],
      additionalTerms: [],
    })
    expect(work?.sample).toBeUndefined()
  })

  it('returns null for another content type', () => {
    expect(
      normalizeWork({ id: 'x', sub: '', status: 'ACTIVE', contractAddress: '', metadata: { type: 'location' } }, ''),
    ).toBeNull()
  })
  it('reads new preview metadata, preserves text, and ignores unsupported licenses', () => {
    const work = normalizeWork(
      {
        id: 'new',
        sub: 'author',
        status: 'ACTIVE',
        contractAddress: '0xcontent',
        metadata: {
          type: 'works',
          contentType: 'Script',
          preview_files_name: ['preview-files-1.pdf'],
          sample_file_name: 'sample.pdf',
          sample_text: 'First paragraph\n\nSecond paragraph',
          licensing: {
            licenseTypes: { perpetual: true, 'single-use': true, 'ai-training': true },
            licensePrices: { perpetual: '2000', 'single-use': '2500', 'ai-training': '3000' },
          },
        },
      },
      '0xcontent',
    )
    expect(work?.sample?.filename).toBe('sample.pdf')
    expect(work?.sample?.url).toBe('https://preview-files-staging.chapterip.com/0xcontent/new/sample.pdf')
    expect(work?.sampleText).toBe('First paragraph\n\nSecond paragraph')
    expect(work?.licenses.map(({ id }) => id)).toEqual(['perpetual', 'single-use'])
  })

  it('does not revive a deleted legacy Script sample', () => {
    const work = normalizeWork(
      {
        id: 'new',
        sub: 'author',
        status: 'ACTIVE',
        contractAddress: '0xcontent',
        metadata: {
          type: 'works',
          contentType: 'Script',
          preview_files_name: [],
          sample_file_name: '',
          files_name: ['private.pdf'],
        },
      },
      '0xcontent',
    )
    expect(work?.sample).toBeUndefined()
  })

  it('does not assume a legacy Lyrics original exists in the preview bucket', () => {
    const work = normalizeWork(
      {
        id: 'lyrics',
        sub: 'author',
        status: 'ACTIVE',
        contractAddress: '0xcontent',
        metadata: {
          type: 'works',
          contentType: 'Lyrics',
          preview_files_name: [],
          files_name: ['lyrics.txt'],
        },
      },
      '0xcontent',
    )
    expect(work?.sample).toBeUndefined()
  })
})

it('does not invent a preview URL for a failed Lyrics sample upload', () => {
  const work = normalizeWork(
    {
      id: 'lyrics',
      sub: 'author',
      status: 'ACTIVE',
      contractAddress: '0xcontent',
      metadata: {
        type: 'works',
        contentType: 'Lyrics',
        sample_file_name: '',
        preview_files_name: [],
        files_name: ['work_1.txt'],
      },
    },
    '0xcontent',
  )
  expect(work?.sample).toBeUndefined()
})
