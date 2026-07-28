import type { goto } from '$app/navigation'
import { configStore } from '$lib/stores/config.svelte'

export const openMarketplaceAndGoToDashboard = async (gotoFn: typeof goto, resetStore: () => void) => {
  const url = import.meta.env.VITE_MARKETPLACE_URL || configStore.getMarketplaceUrl()
  window.open(url, '_blank')
  await gotoFn('/authed/files')
  resetStore()
}
