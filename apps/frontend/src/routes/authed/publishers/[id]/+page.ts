import { configStore, ContractName } from '$lib/stores/config.svelte'
import { getMembershipPrice } from '$lib/membership'
import { toLikenessItems } from '../../likeness/likeness'
import { toLocationItems } from '../../location/location'
import { toWorkItems } from '../../creative-works/works'
import { STATUS } from '@repo/content-types/content'

export const load = async ({ params, parent }) => {
  const { trpcClient } = await parent()
  if (!trpcClient) throw new Error('tRPC client is not initialized')

  const publisher = await trpcClient.publishers.getPublisher.query({ id: params.id })
  const contractAddress = configStore.getContractAddress(ContractName.CONTENT_NFT)

  const { items: contentItems } = await trpcClient.contents.findContent.query({
    sub: publisher.sub,
    contractAddress,
    status: STATUS.ACTIVE,
  })

  const items = [
    ...toLikenessItems(contentItems, contractAddress).map((i) => ({ ...i, type: 'likeness' as const })),
    ...toLocationItems(contentItems, contractAddress).map((i) => ({ ...i, type: 'location' as const })),
    ...toWorkItems(contentItems, contractAddress).map((w) => ({
      ...w,
      name: w.title,
      type: 'creative-works' as const,
    })),
  ]

  const subscriptionPrice = publisher.evmAddress ? await getMembershipPrice(publisher.evmAddress) : 0

  return {
    publisher,
    items,
    hasSubscription: subscriptionPrice > 0,
  }
}
