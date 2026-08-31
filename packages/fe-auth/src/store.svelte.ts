import type { TAccountUser, TAuthStore, TAuthConfig } from './types'
import { generateRandomString, sha256, base64urlencode } from './helper'
import { createClient } from '@repo/trpc/client'

export function createAuthStore(
  config: TAuthConfig,
  svelteKit: {
    browser: boolean
    goto: (url: string) => Promise<void>
    resolve: (route: any) => string
  },
) {
  const trpcClient = createClient({
    trpcUrl: config.trpcUri || 'http://localhost:8060/trpc',
  })
  const { browser, goto, resolve } = svelteKit

  let state = $state<TAuthStore>({
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    error: null,
    isInitialized: false,
  })

  let refreshTokenPromise: Promise<boolean> | null = null

  async function init() {
    if (!browser) return

    state.isLoading = true

    try {
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        const success = await refreshAccessToken(true)

        if (success) {
          state.isLoading = false
          state.isInitialized = true
          return
        }
      }

      state.isLoading = false
      state.isInitialized = true
    } catch (error) {
      console.error('Error during initialization:', error)
      state.isLoading = false
      state.isInitialized = true
      state.error = null
    }
  }

  async function startLogin() {
    if (!browser) return

    state.isLoading = true
    state.error = null

    try {
      const verifier = generateRandomString(128)
      const verifierHashed = await sha256(verifier)
      const codeChallenge = base64urlencode(verifierHashed)

      const stateParam = generateRandomString(32)
      const nonce = generateRandomString(32)

      localStorage.setItem('oauth_verifier', verifier)
      localStorage.setItem('oauth_state', stateParam)
      localStorage.setItem('oauth_nonce', nonce)

      const redirectUri = `${window.location.origin}${config.redirectPath || '/auth/callback'}`

      const authUrl = new URL(`${config.oauthUri}/oauth2/authorize`)
      authUrl.searchParams.set('client_id', config.clientId)
      authUrl.searchParams.set('scope', config.scopes)
      authUrl.searchParams.set('nonce', nonce)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('state', stateParam)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      authUrl.searchParams.set('code_challenge', codeChallenge)

      window.location.href = authUrl.toString()
    } catch (error) {
      console.error('Error starting login:', error)
      state.isLoading = false
      state.error = 'Failed to initiate authorization'
    }
  }

  async function exchangeCodeForTokens(code: string, stateParam: string, redirectAfterLogin: string) {
    if (!browser) return

    state.isLoading = true
    state.error = null

    try {
      const savedState = localStorage.getItem('oauth_state')
      if (stateParam !== savedState) {
        throw new Error('Invalid state parameter')
      }

      const verifier = localStorage.getItem('oauth_verifier')
      if (!verifier) {
        throw new Error('No verifier found')
      }

      const redirectUri = `${window.location.origin}${config.redirectPath || '/auth/callback'}`

      const tokens = await trpcClient.auth.exchangeCode.mutate({
        code,
        redirectUri,
        codeVerifier: verifier,
      })

      if (tokens.refreshToken) {
        localStorage.setItem('refresh_token', tokens.refreshToken)
      }

      localStorage.removeItem('oauth_verifier')
      localStorage.removeItem('oauth_state')
      localStorage.removeItem('oauth_nonce')

      state.accessToken = tokens.accessToken
      state.isLoading = false
      state.isInitialized = true

      await goto(resolve(redirectAfterLogin))
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      state.isLoading = false
      state.error = 'Failed to obtain tokens'
      throw error
    }
  }

  async function performRefreshAccessToken(silent: boolean): Promise<boolean> {
    if (!browser) return false

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return false

    if (!silent) {
      state.isLoading = true
      state.error = null
    }

    try {
      const tokens = await trpcClient.auth.refreshToken.mutate({
        refreshToken,
      })

      if (tokens.refreshToken) {
        localStorage.setItem('refresh_token', tokens.refreshToken)
      }

      state.accessToken = tokens.accessToken
      state.isLoading = false
      state.error = null

      return true
    } catch (error) {
      console.error('Error refreshing token:', error)

      if (!silent) {
        state.isLoading = false
        state.error = 'Please log in again'
      }

      logout()
      return false
    }
  }

  async function refreshAccessToken(silent = false): Promise<boolean> {
    if (refreshTokenPromise) return await refreshTokenPromise

    const refresh = async () => await performRefreshAccessToken(silent)
    const promise =
      'locks' in navigator ? navigator.locks.request('chapter-ip:oauth-refresh-token', refresh) : refresh()

    refreshTokenPromise = promise
    try {
      return await promise
    } finally {
      if (refreshTokenPromise === promise) refreshTokenPromise = null
    }
  }

  let accessTokenPromise: Promise<string | null> | null = null
  async function getAccessToken(): Promise<string | null> {
    if (state.accessToken) {
      return state.accessToken
    }

    if (!accessTokenPromise) {
      accessTokenPromise = refreshAccessToken(true)
        .then((refreshed) => (refreshed ? state.accessToken : null))
        .finally(() => {
          accessTokenPromise = null
        })
    }

    return accessTokenPromise
  }

  async function getSubFromToken(): Promise<string | null> {
    const accessToken = await getAccessToken()
    if (!accessToken) return null
    const payload = accessToken.split('.')[1]
    return JSON.parse(atob(payload)).sub as string
  }

  async function getCurrentUser(): Promise<TAccountUser> {
    const accessToken = await getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available')
    }

    const response = await fetch(`${config.accountsUri}/oauth2/userinfo`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch current user: ${response.status} ${response.statusText}`)
    }

    return (await response.json()) as TAccountUser
  }

  function logout() {
    if (!browser) return

    const accessToken = state.accessToken
    localStorage.removeItem('refresh_token')

    state = {
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isInitialized: true,
    }

    void goto(resolve('/'))

    if (accessToken) {
      void revokeOAuth2Session(accessToken).catch((error: unknown) => {
        console.error('Error revoking session:', error)
      })
    }
  }

  async function revokeOAuth2Session(accessToken: string) {
    try {
      const response = await fetch(`${config.accountsUri}/oauth2/revoke-session`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error(response.statusText)
    } catch {
      throw new Error(`Error revoking session`)
    }
  }

  return {
    get state() {
      return state
    },
    init,
    startLogin,
    exchangeCodeForTokens,
    refreshAccessToken,
    getAccessToken,
    getSubFromToken,
    getCurrentUser,
    logout,
  }
}

export type AuthStore = ReturnType<typeof createAuthStore>
