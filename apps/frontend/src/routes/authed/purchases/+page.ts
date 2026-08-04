import { configStore, ContractName } from '$lib/stores/config.svelte'
import type { createClient } from '@repo/trpc/client'
import { LICENSE_TYPE_VALUES } from '@repo/content-types/content'
import { getTokensWithMetadata } from './helper'
import { toPurchaseRows } from './rows'

async function getAuthorNamesBySub(
  trpcClient: ReturnType<typeof createClient>,
  subs: string[],
): Promise<Record<string, string>> {
  const authorNamesBySub: Record<string, string> = {}

  await Promise.all(
    subs.map(async (sub) => {
      try {
        const { items } = await trpcClient.publishers.findPublishers.query({ sub, limit: '1' })
        if (items[0]?.title) authorNamesBySub[sub] = items[0].title
      } catch (error) {
        console.error(`Error fetching publisher for sub ${sub}:`, error)
      }
    }),
  )

  return authorNamesBySub
}

export const load = async ({ parent }) => {
  const { accessToken, trpcClient } = await parent()

  const tokens = await getTokensWithMetadata(accessToken!, trpcClient!)

  const lifetimeLicenses = tokens.filter((p) => p.licenseType === `${LICENSE_TYPE_VALUES.lifetime}`)
  const onetimeLicenses = tokens.filter((p) => p.licenseType === `${LICENSE_TYPE_VALUES.oneTime}`)
  const purchases = [...lifetimeLicenses, ...onetimeLicenses].sort(
    (a, b) => Number(b.licenseTokenId) - Number(a.licenseTokenId),
  )
  const locationSubs = [...new Set(purchases.map((purchase) => purchase.sub).filter(Boolean) as string[])]
  const authorNamesBySub = await getAuthorNamesBySub(trpcClient!, locationSubs)
  const contractAddress = configStore.getContractAddress(ContractName.CONTENT_NFT)
  const purchaseRows = toPurchaseRows(purchases, contractAddress, authorNamesBySub)

  return {
    lifetimeLicenses,
    onetimeLicenses,
    purchaseRows,
    trpcClient,
  }
}
