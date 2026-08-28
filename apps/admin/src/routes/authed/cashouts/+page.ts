import { browser } from '$app/environment'
import { adminStore } from '$lib/stores/admin.svelte'
import { getTrpcClient } from '$lib/stores/trpc-client'
import { redirect } from '@sveltejs/kit'

export const load = async () => {
  if (browser && !adminStore.isClientAdmin) {
    throw redirect(302, '/authed/files')
  }

  const result = await getTrpcClient().cashouts.findCashouts.query({})

  return {
    cashouts: result.items,
  }
}
