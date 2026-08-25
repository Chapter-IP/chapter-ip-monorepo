<script lang="ts">
  import { onMount } from 'svelte'
  import { notify, ToastType } from '@repo/ui-components'
  import { getCashoutBalance, requestCashout } from '$lib/services/cashout'

  let available = $state(0)
  let pending = $state(0)
  let loading = $state(true)
  let submitting = $state(false)
  let amount = $state(0)
  let paymentMethod = $state<'venmo' | 'cashapp' | ''>('')
  let username = $state('')

  const amountCents = $derived(Math.round(amount * 100))
  const availableCents = $derived(Math.round(available * 100))
  const formattedAvailable = $derived(
    `$${available.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
  )
  const formattedPending = $derived(
    `$${pending.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
  )
  const canSubmit = $derived(
    availableCents > 0 &&
      !submitting &&
      !loading &&
      amountCents > 0 &&
      amountCents <= availableCents &&
      Math.abs(amount * 100 - amountCents) < 1e-8 &&
      paymentMethod !== '' &&
      username.trim() !== '',
  )

  onMount(async () => {
    try {
      const bal = await getCashoutBalance()
      available = bal.available
      pending = bal.pending
    } catch {
      notify('Failed to load cash out balance', ToastType.FAIL)
    } finally {
      loading = false
    }
  })

  async function handleCashout() {
    if (!canSubmit || paymentMethod === '') return

    submitting = true
    try {
      await requestCashout({
        amount,
        paymentMethod,
        username: username.trim(),
      })
      pending = (Math.round(pending * 100) + amountCents) / 100
      available = (availableCents - amountCents) / 100
      amount = 0
      notify('Cash out requested successfully', ToastType.SUCCESS)
    } catch {
      notify('Failed to request cash out', ToastType.FAIL)
    } finally {
      submitting = false
    }
  }
</script>

<div class="w-full max-w-2xl rounded-lg border border-[#dddddd] p-6">
  <h2 class="text-[22px] font-semibold text-dark">Cash out</h2>
  <p class="mt-1 text-sm text-[#69656d]">
    {#if loading}
      Loading your balance…
    {:else}
      Congratulations, you've earned {formattedAvailable}. Your funds are ready to be directly transferred.
    {/if}
  </p>

  <div class="mt-6">
    <p class="mb-1 text-sm font-medium text-[#69656d]">Balance:</p>
    <p class="text-3xl font-bold text-dark">{loading ? '…' : formattedAvailable}</p>
    {#if pending > 0}
      <p class="mt-1 text-sm text-[#69656d]">Pending cash out: {formattedPending}</p>
    {/if}
  </div>

  <div class="mt-6 flex w-full max-w-md flex-col">
    <label for="cashout-amount" class="mb-2.5 block text-sm font-medium text-[#69656d]">Amount</label>
    <div class="relative w-full">
      <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <span class="text-[15px] text-[#9d99a0]">$</span>
      </div>
      <input
        id="cashout-amount"
        type="number"
        step="0.01"
        min="0.01"
        max={available}
        placeholder={loading ? 'Loading...' : '0.00'}
        disabled={loading || submitting || available === 0}
        bind:value={amount}
        class="h-13 w-full rounded-sm border border-[#ded9d5] bg-white pl-8 pr-14 text-[15px] text-dark outline-none transition-colors placeholder:text-[#c0bcc2] focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
      />
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
        <span class="text-[15px] text-[#9d99a0]">USD</span>
      </div>
    </div>
  </div>

  <div class="mt-6 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
    <div class="w-full">
      <label for="cashout-method" class="mb-2.5 block text-sm font-medium text-[#69656d]">
        Cash out with: <span class="text-[#ef476f]">* required</span>
      </label>
      <select
        id="cashout-method"
        bind:value={paymentMethod}
        disabled={loading || submitting || available === 0}
        class="h-[52px] w-full rounded-[4px] border border-[#ded9d5] bg-white px-4 text-[15px] text-dark outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
      >
        <option value="">Select…</option>
        <option value="venmo">Venmo</option>
        <option value="cashapp">CashApp</option>
      </select>
    </div>

    <div class="w-full">
      <label for="cashout-username" class="mb-2.5 block text-sm font-medium text-[#69656d]">
        Username: <span class="text-[#ef476f]">* required</span>
      </label>
      <input
        id="cashout-username"
        type="text"
        bind:value={username}
        placeholder="@username"
        disabled={loading || submitting || available === 0}
        class="h-[52px] w-full rounded-[4px] border border-[#ded9d5] bg-white px-4 text-[15px] text-dark outline-none transition-colors placeholder:text-[#c0bcc2] focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  </div>

  <div class="mt-10 flex justify-end">
    <button
      type="button"
      disabled={!canSubmit}
      onclick={handleCashout}
      class="inline-flex h-10 min-w-28 items-center justify-center rounded-sm bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#5a28ef] disabled:cursor-not-allowed disabled:bg-[#dedad7] disabled:text-white/70"
    >
      {#if submitting}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        Initiate Cash Out
      {/if}
    </button>
  </div>
</div>
