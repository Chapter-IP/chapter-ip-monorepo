import { browser } from '$app/environment'
import { authStore } from '$lib'
import { createClient } from '@repo/trpc/client'
import { goto } from '$app/navigation'
import { configStore } from '$lib/stores/config.svelte'
import { publisherStore } from '$lib/stores/publisher.svelte'
import { adminStore } from '$lib/stores/admin.svelte'

export const prerender = false
export const ssr = false

let authInitialized = false

async function loadFunction() {
  if (!browser) return {}

  if (!authInitialized) {
    authInitialized = true
    await authStore.init()
  }

  const accessToken = await authStore.getAccessToken()

  if (!accessToken) {
    return goto(`/`)
  }

  const trpcClient = createClient({
    trpcUrl: import.meta.env.VITE_TRPC_URL || 'http://localhost:8060/trpc',
    getAccessTokenFn: () => authStore.state.accessToken!,
  })

  const config = await trpcClient.contents.config.query()
  configStore.set(config)

  const sub = await authStore.getSubFromToken()
  try {
    const publisher = await trpcClient.publishers.getPublisher.query({
      sub: sub!,
    })
    publisherStore.setData(publisher)
  } catch {
    console.log('no publisher data found')
  }

  try {
    const isClientAdmin = await trpcClient.app.isClientAdmin.query()
    adminStore.set(isClientAdmin)
  } catch {
    adminStore.set(false)
  }

  return {
    trpcClient,
  }
}

export const load = loadFunction
