import { describe, expect, it, vi } from 'vitest'

const CONTRACT = '0xcontent'
vi.mock('$lib/stores/config.svelte', () => ({
  ContractName: { CONTENT_NFT: 'CONTENT_NFT' },
  configStore: { getContractAddress: () => CONTRACT },
}))

describe('creative works catalog load', () => {
  it('loads filtered and recent ACTIVE works independently', async () => {
    const { load } = await import('./+page')
    const query = vi
      .fn()
      .mockResolvedValueOnce({ items: [{ id: 'filtered', metadata: { type: 'works', name: 'Pendulum' } }] })
      .mockResolvedValueOnce({ items: [{ id: 'recent', metadata: { type: 'works', name: 'Irregardless' } }] })

    const data = await load({
      parent: async () => ({ trpcClient: { contents: { findContent: { query } } } }),
      url: new URL('https://marketplace.example/authed/creative-works?q=script'),
    } as unknown as Parameters<typeof load>[0])

    expect(query).toHaveBeenCalledTimes(2)
    expect(query.mock.calls[0]?.[0]).toMatchObject({
      contractAddress: CONTRACT,
      status: 'ACTIVE',
      metadata: { and: [{ field: 'type', op: 'eq', val: 'works' }, expect.any(Object)] },
    })
    expect(query.mock.calls[1]?.[0]).toMatchObject({
      limit: '10',
      metadata: { and: [{ field: 'type', op: 'eq', val: 'works' }] },
    })
    expect(data.workItems[0]?.title).toBe('Pendulum')
    expect(data.recentWorkItems[0]?.title).toBe('Irregardless')
  })
})
