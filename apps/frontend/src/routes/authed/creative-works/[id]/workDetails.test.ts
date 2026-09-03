import { describe, expect, it } from 'vitest'
import { normalizeWork } from './workDetails'
import { WORK_PLACEHOLDER_URL } from '../works'

describe('creative work detail normalizer', () => {
  it('normalizes Script metadata and only exposes single-use', () => {
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
          licensing: {
            licenseTypes: { 'single-use': true, perpetual: true },
            licensePrices: { 'single-use': '25', perpetual: '100' },
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
      image: { src: WORK_PLACEHOLDER_URL },
      licenses: [{ id: 'single-use', name: 'Single-use license', price: '25' }],
    })
  })

  it('returns null for another content type', () => {
    expect(
      normalizeWork({ id: 'x', sub: '', status: 'ACTIVE', contractAddress: '', metadata: { type: 'location' } }, ''),
    ).toBeNull()
  })
})
