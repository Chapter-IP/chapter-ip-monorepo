import { getAuthConfig } from '@repo/fe-auth'
import { authStore } from '$lib/auth'

const accountsUri = getAuthConfig(import.meta.env).accountsUri
const clientId = import.meta.env.VITE_CLIENT_ID

async function fetchAccount(sub: string) {
  const token = await authStore.getAccessToken()
  const response = await fetch(`${accountsUri}/accounts/${sub}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      Authorization: `Bearer ${token ?? ''}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to load account ${sub}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

const cache = new Map<string, { name: string; email: string }>()

export async function getUserBySub(sub: string) {
  const cached = cache.get(sub)
  if (cached) return cached

  const data = await fetchAccount(sub)
  const user = { name: data.name ?? '', email: data.email ?? '' }
  cache.set(sub, user)
  return user
}
