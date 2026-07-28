import { configStore, ContractName } from '$lib/stores/config.svelte'
import { buildLikenessFindContentInput, toLikenessItems } from './likeness/likeness'
import { buildLocationFindContentInput, toLocationItems } from './location/location'

export const load = async ({ parent }) => {
  const { trpcClient } = await parent()
  if (!trpcClient) throw new Error('tRPC client is not initialized')

  const contractAddress = configStore.getContractAddress(ContractName.CONTENT_NFT)
  const [likenessContent, locationContent] = await Promise.all([
    trpcClient.contents.findContent.query({
      ...buildLikenessFindContentInput(contractAddress),
      limit: '100',
    }),
    trpcClient.contents.findContent.query({
      ...buildLocationFindContentInput(contractAddress),
      limit: '100',
    }),
  ])

  return {
    likenessItems: toLikenessItems(likenessContent.items, contractAddress),
    locationItems: toLocationItems(locationContent.items, contractAddress),
  }
}
