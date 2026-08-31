import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { authStore } from '$lib'
import { configStore } from '$lib/stores/config.svelte'
import { getSigner, initProvider } from '@repo/fe-evm-provider'
import { createClient } from '@repo/trpc/client'

export const prerender = false
export const ssr = false

let authInitialized = false

export const load = async () => {
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
    getAccessTokenFn: () => accessToken,
  })
  const config = await trpcClient.contents.config.query()
  configStore.set(config)

  localStorage.setItem('credenza_web_sdk:access_token', accessToken)
  localStorage.setItem('credenza_web_sdk:login_provider', 'oauth')

  await initProvider(accessToken)
  const signer = await getSigner()
  const userAddress = await signer.getAddress()

  return {
    accessToken,
    trpcClient,
    userAddress,
  }
}
