<script lang="ts">
  import { passportStore } from '$lib/passport.store'
  import { Passport } from '@credenza3/passport-evm'
  import { onMount } from 'svelte'
  import { afterNavigate, beforeNavigate } from '$app/navigation'

  let { children } = $props()
  let isMounted = $state(false)
  let loading = $state(false)

  beforeNavigate(() => {
    loading = true
  })

  afterNavigate(() => {
    loading = false
  })

  onMount(async () => {
    loading = true
    const credenzaEnv = import.meta.env.VITE_ENV || 'staging'
    const passport = new Passport({
      chainId: credenzaEnv === 'prod' ? '43114' : '43113',
      clientId: import.meta.env.VITE_CLIENT_ID,
      // provider: window.ethereum,
      config: {
        receiptTarget: ['phone', 'email'],
        content: {
          cloak: false,
        },
      },
    })

    try {
      await passport.init()
      passportStore.set(passport)
    } catch (error) {
      console.error('Wallet initialisation failed:', error)
    }

    isMounted = true
    loading = false
  })
</script>

{#if loading}
  <div class="flex items-center justify-center h-16">
    <span class="loading loading-dots loading-lg"></span>
  </div>
{:else if isMounted}
  {@render children?.()}
{/if}
