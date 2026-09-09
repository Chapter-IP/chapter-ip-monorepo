<script lang="ts">
  import { likenessStore, isFormValid } from '../stores/likeness-store'
  import ApprovalSettings from './ApprovalSettings.svelte'
  import LicenseTypes from './LicenseTypes.svelte'
  import PermittedUses from './PermittedUses.svelte'
  // import TerritorySelector from './TerritorySelector.svelte'

  let {
    currentStep = $bindable(),
    onSaveDraft,
  }: {
    currentStep: number
    onSaveDraft?: () => Promise<void>
  } = $props()

  const primaryLikenessFile = $derived($likenessStore.files.headshots)

  function toggleAgreement() {
    likenessStore.setAgreedToFee(!$likenessStore.licensing.agreedToFee)
  }

  const canContinueFromStepTwo = $derived(
    Boolean(!$likenessStore.ui.loading && primaryLikenessFile && $likenessStore.licensing.agreedToFee),
  )
</script>

{#snippet divider(className = '')}
  <div class={`border-t border-dashed border-[#ddd4cc] ${className}`}></div>
{/snippet}

<div class="space-y-12 mt-7.25 text-dark">
  <div class="pb-3">
    <h2 class="mb-2 text-[28px] font-medium text-left text-dark">Licensing</h2>

    <p class="mt-3 text-base text-[#72717b]">
      Set the terms buyers must accept before they can license your likeness. You can update these anytime. Active
      licenses remain governed by the terms in force at the time of purchase.
    </p>
  </div>

  <LicenseTypes />
  {@render divider('mx-10')}
  <PermittedUses />
  {@render divider()}
  <ApprovalSettings />
  {@render divider()}

  <div class="flex justify-center">
    <label class="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onclick={toggleAgreement}
        class={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          $likenessStore.licensing.agreedToFee ? 'bg-primary border-primary' : 'border-[#ddd4cc] bg-white'
        }`}
      >
        {#if $likenessStore.licensing.agreedToFee}
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        {/if}
      </button>

      <span class="text-sm text-[#71707a]">
        I am aware and consent to ChapterIP adding a 3% transaction fee on all sales.
        <span class="text-[#ff0000]">*</span>
      </span>
    </label>
  </div>
</div>

<div class="flex justify-end gap-1.5 mt-12.5">
  {#if onSaveDraft}
    <button
      class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-cream border border-[#ddd4cc] disabled:bg-[#e1dddb] text-dark"
      onclick={onSaveDraft}
      disabled={$likenessStore.ui.loading}
    >
      Save as draft
    </button>
  {/if}
  <button
    class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#e1dddb] text-cream"
    onclick={() => (currentStep = 1)}
    disabled={$likenessStore.ui.loading}
  >
    Go back
  </button>
  {#if $isFormValid}
    <button
      class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#e1dddb] text-cream"
      onclick={() => (currentStep = 3)}
      disabled={!canContinueFromStepTwo}
    >
      Save and Continue
    </button>
  {/if}
</div>
