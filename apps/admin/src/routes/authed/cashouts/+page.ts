import { browser } from '$app/environment'
import { adminStore } from '$lib/stores/admin.svelte'
import { redirect } from '@sveltejs/kit'

export const load = async () => {
  if (browser && !adminStore.isClientAdmin) {
    throw redirect(302, '/authed/files')
  }

  return {}
}
