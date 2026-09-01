import { browser } from '$app/environment'
import { redirect } from '@sveltejs/kit'
import { adminStore } from '$lib/stores/admin.svelte'

export const load = async ({ parent }) => {
  await parent()

  if (browser && !adminStore.isClientAdmin) {
    throw redirect(302, '/authed/files')
  }

  return {}
}
