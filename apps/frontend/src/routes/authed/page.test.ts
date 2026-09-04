import { describe, expect, it, vi } from 'vitest'

const CONTRACT_ADDRESS = '0xcontent'

vi.mock('$lib/stores/config.svelte', () => ({
  ContractName: { CONTENT_NFT: 'CONTENT_NFT' },
  configStore: {
    getContractAddress: vi.fn(() => CONTRACT_ADDRESS),
  },
}))

describe('catalog page load', () => {
  it('loads creative work, likeness, and location catalog items with separate metadata filters', async () => {
    const { load } = await import('./+page')
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        items: [
          {
            id: 'work-1',
            metadata: {
              type: 'works',
              name: 'Pendulum',
              contentType: 'Script',
              description: 'A thriller.',
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'likeness-1',
            metadata: {
              type: 'likeness',
              profile: { fullLegalName: 'Avery Stone', bio: 'Actor and vocalist.' },
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'location-1',
            metadata: {
              type: 'location',
              name: 'Madison Square Garden',
              description: 'A landmark arena.',
              preview_file_name: 'msg.jpg',
            },
          },
        ],
      })
    const event = {
      parent: async () => ({
        trpcClient: {
          contents: {
            findContent: { query },
          },
        },
      }),
    } as unknown as Parameters<typeof load>[0]

    const data = await load(event)

    expect(query).toHaveBeenCalledTimes(3)
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: '100',
        metadata: { and: [{ field: 'type', op: 'eq', val: 'works' }] },
      }),
    )
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: '100',
        metadata: { and: [{ field: 'type', op: 'eq', val: 'likeness' }] },
      }),
    )
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        limit: '100',
        metadata: { and: [{ field: 'type', op: 'eq', val: 'location' }] },
      }),
    )
    expect(data.workItems).toMatchObject([{ id: 'work-1', title: 'Pendulum' }])
    expect(data.likenessItems).toMatchObject([{ id: 'likeness-1', name: 'Avery Stone' }])
    expect(data.locationItems).toMatchObject([{ id: 'location-1', name: 'Madison Square Garden' }])
  })
})
