import { describe, expect, it } from 'vitest'
import { r2BaseConfig } from '@repo/fe-services'
import {
  WORK_PLACEHOLDER_URL,
  buildWorkFilterInput,
  buildWorkFindContentInput,
  getWorkPreviewUrl,
  toWorkItems,
} from './works'

const CONTRACT = '0xcontent'

describe('creative work data helpers', () => {
  it('maps works, normalizes arrays, and excludes other content types', () => {
    expect(
      toWorkItems(
        [
          {
            id: 'work-1',
            metadata: {
              type: 'works',
              name: 'Pendulum',
              contentType: 'Script',
              description: 'A thriller.',
              authors: [' Chadwick Bowser ', ''],
              genre: ['Thriller'],
            },
          },
          { id: 'location-1', metadata: { type: 'location' } },
        ],
        CONTRACT,
      ),
    ).toMatchObject([
      {
        id: 'work-1',
        title: 'Pendulum',
        contentType: 'Script',
        authors: ['Chadwick Bowser'],
        genres: ['Thriller'],
        imageUrl: WORK_PLACEHOLDER_URL,
      },
    ])
  })

  it('uses a work placeholder when no preview exists', () => {
    expect(toWorkItems([{ id: 'work-2', metadata: { type: 'works', name: 'Lyrics' } }], CONTRACT)[0]?.imageUrl).toBe(
      WORK_PLACEHOLDER_URL,
    )
  })

  it('builds the preview URL', () => {
    expect(getWorkPreviewUrl(CONTRACT, 'work-1', 'preview.png')).toBe(
      `${r2BaseConfig.previewUrl}/${CONTRACT}/work-1/preview.png`,
    )
  })

  it('builds an ACTIVE works query and searches all marketplace fields', () => {
    expect(buildWorkFindContentInput(CONTRACT).status).toBe('ACTIVE')
    expect(buildWorkFilterInput({ query: 'A. B' })).toEqual({
      and: [
        { field: 'type', op: 'eq', val: 'works' },
        {
          or: ['name', 'description', 'contentType', 'genre', 'authors'].map((field) => ({
            field,
            op: 'regex',
            val: '[aA]\\. [bB]',
          })),
        },
      ],
    })
  })
})
