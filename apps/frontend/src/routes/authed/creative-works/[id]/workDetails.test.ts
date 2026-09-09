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
})
