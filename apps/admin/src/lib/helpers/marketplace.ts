import type { goto } from '$app/navigation'

export const openMarketplaceAndGoToDashboard = async (gotoFn: typeof goto, resetStore: () => void) => {
  window.open(import.meta.env.VITE_MARKETPLACE_URL || 'https://marketplace-staging.chapterip.com/', '_blank')
  await gotoFn('/authed/files')
  resetStore()
}
