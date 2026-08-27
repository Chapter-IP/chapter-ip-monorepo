<script lang="ts">
  import { ethers, getSigner, initProvider } from '@repo/fe-evm-provider'
  import { publisherStore } from '$lib/stores/publisher.svelte'
  import { authStore } from '$lib/auth'
  import { configStore, ContractName } from '$lib/stores/config.svelte'
  import { saveSubscriptionPrice } from '$lib/services/membership'
  import { notify, ToastType } from '@repo/ui-components'

  let { onUpdate, hideSaveButton = false } = $props<{
    onUpdate?: (price: number) => void
    hideSaveButton?: boolean
  }>()

  let value = $state(0)
  let savedValue = $state(0)
  let loading = $state(true)
  let saving = $state(false)

  const hasChanges = $derived(Math.round(value * 100) !== Math.round(savedValue * 100))

  function getMembershipContract(signer: ethers.Signer) {
    return configStore.getContract(ContractName.MEMBERSHIP, signer)
  }

  async function handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    const numValue = parseFloat(target.value)
    value = isNaN(numValue) ? 0 : numValue

    if (onUpdate) {
      onUpdate(value)
    }
  }

  async function getCurrentSubscriptionPrice() {
    if (!publisherStore.evmAddress) {
      loading = false
      return
    }

    loading = true

    try {
      await initProvider(authStore.state.accessToken!)
      const signer = await getSigner()
      const membershipContract = getMembershipContract(signer)

      const price: bigint = await membershipContract.getPriceFiat(BigInt(ethers.getAddress(publisherStore.evmAddress)))
      value = Number(price) / 100
      savedValue = value

      if (onUpdate) {
        onUpdate(value)
      }
    } catch (error) {
      console.error('Error getting current subscription price:', error)
      value = 0
      notify('Failed to load subscription price', ToastType.FAIL)
    } finally {
      loading = false
    }
  }

  async function handleSave() {
    if (value <= 0 || saving || !hasChanges) return

    saving = true
    try {
      await saveSubscriptionPrice(value)
      savedValue = value
      notify('Subscription price saved successfully', ToastType.SUCCESS)
    } catch (error) {
      console.error('Error saving subscription price:', error)
      notify('Failed to save subscription price', ToastType.FAIL)
    } finally {
      saving = false
    }
  }

  $effect(() => {
    if (publisherStore.evmAddress) {
      getCurrentSubscriptionPrice()
    }
  })
</script>

<div class="flex w-full flex-col">
  <h2 class="text-[22px] font-semibold text-dark">Subscription price</h2>
  <p class="mt-1 text-sm text-[#69656d]">Set a subscription price for your membership.</p>

  {#if !publisherStore.evmAddress}
    <p class="mt-6 text-sm text-[#9d99a0]">Publisher wallet address is not available.</p>
  {:else}
    <div class="mt-6 flex w-full max-w-md flex-col items-start">
      <label for="subscription-price" class="mb-2.5 block text-sm font-medium text-[#69656d]">
        Subscription Price ($)
      </label>
      <div class="relative w-full">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <span class="text-[15px] text-[#9d99a0]">$</span>
        </div>
        <input
          id="subscription-price"
          type="number"
          step="0.01"
          min="0"
          placeholder={loading ? 'Loading...' : '0.00'}
          disabled={loading || saving}
          {value}
          oninput={handleInput}
          class="h-13 w-full rounded-sm border border-[#ded9d5] bg-white pl-8 pr-14 text-[15px] text-dark outline-none transition-colors placeholder:text-[#c0bcc2] focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
        />
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <span class="text-[15px] text-[#9d99a0]">USD</span>
        </div>
      </div>
    </div>

    {#if !hideSaveButton}
      <div class="mt-10 flex justify-center">
        <button
          type="button"
          disabled={!hasChanges || value <= 0 || loading || saving}
          onclick={handleSave}
          class="inline-flex h-10 min-w-28 items-center justify-center rounded-sm bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#5a28ef] disabled:cursor-not-allowed disabled:bg-[#dedad7] disabled:text-white/70"
        >
          {#if saving}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            Set Subscription Price
          {/if}
        </button>
      </div>
    {/if}
  {/if}
</div>
