import { configStore, ContractName } from '$lib/stores/config.svelte'
import { RECENT_WORKS_LIMIT, buildWorkFindContentInput, getRecentWorks, parseWorkFilters, toWorkItems } from './works'

export const load = async ({ parent, url }) => {
  const { trpcClient } = await parent()
  if (!trpcClient) throw new Error('tRPC client is not initialized')

  const contractAddress = configStore.getContractAddress(ContractName.CONTENT_NFT)
  const filters = parseWorkFilters(url.searchParams)
  const [filteredContent, recentContent] = await Promise.all([
    trpcClient.contents.findContent.query(buildWorkFindContentInput(contractAddress, filters)),
    trpcClient.contents.findContent.query({
      ...buildWorkFindContentInput(contractAddress),
      limit: String(RECENT_WORKS_LIMIT),
    }),
  ])

  return {
    filters,
    workItems: toWorkItems(filteredContent.items, contractAddress),
    recentWorkItems: getRecentWorks(toWorkItems(recentContent.items, contractAddress)),
  }
}
