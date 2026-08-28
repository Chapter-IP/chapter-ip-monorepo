<script lang="ts">
  import type { CreateCashoutInput } from '$lib/services/cashout'

  type CashoutPlatform = CreateCashoutInput['platform']

  let {
    loading,
    submitting,
    available,
    pending,
    formattedAvailable,
    formattedPending,
    canSubmit,
    usernameError,
    platform = $bindable('' as CashoutPlatform | ''),
    username = $bindable(''),
    onCashout,
  }: {
    loading: boolean
    submitting: boolean
    available: number
    pending: number
    formattedAvailable: string
    formattedPending: string
    canSubmit: boolean
    usernameError: boolean
    platform: CashoutPlatform | ''
    username: string
    onCashout: () => void
  } = $props()
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

  <div class="mt-6 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
    <div class="w-full">
      <label for="cashout-method" class="mb-2.5 block text-sm font-medium text-[#69656d]">
        Cash out with: <span class="text-[#ef476f]">* required</span>
      </label>
      <select
        id="cashout-method"
        bind:value={platform}
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
        maxlength={128}
        disabled={loading || submitting || available === 0}
        class="h-13 w-full rounded-sm border bg-white px-4 text-[15px] text-dark outline-none transition-colors placeholder:text-[#c0bcc2] focus:ring-1 disabled:cursor-not-allowed disabled:opacity-70 {usernameError
          ? 'border-[#f80000] focus:border-[#f80000] focus:ring-[#f80000]'
          : 'border-[#ded9d5] focus:border-primary focus:ring-primary'}"
      />
      {#if usernameError}
        <p class="mt-1.5 text-xs text-[#f80000]">Username must start with @ and contain no spaces.</p>
      {/if}
    </div>
  </div>

  <div class="mt-10 flex justify-end">
    <button
      type="button"
      disabled={!canSubmit}
      onclick={onCashout}
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
