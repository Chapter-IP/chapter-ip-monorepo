<script lang="ts">
  import { workStore, isFormValid } from '../stores/work-store'
  import { LICENSE_TYPES } from '../constants/constants'
  import LicenseTypeRow from '$lib/components/LicenseTypeRow.svelte'

  let {
    currentStep = $bindable(),
    onSaveDraft,
  }: {
    currentStep: number
    onSaveDraft?: () => Promise<void>
  } = $props()

  function toggleAgreement() {
    workStore.setAgreedToFee(!$workStore.licensing.agreedToFee)
  }

  const canContinue = $derived(Boolean($isFormValid && !$workStore.ui.loading))
</script>

<div class="space-y-12 mt-7.25 text-dark">
  <!-- Title Section -->
  <div>
    <h2 class="mb-2 text-[28px] font-medium text-left text-dark font-heading">Licensing</h2>
    <p class="mt-3 text-base text-[#72717b]">
      Set how creators can license this written work. Pick at least one and name your price. Royalties route to you.
    </p>
  </div>

  <!-- License Types -->
  <div class="space-y-4">
    <h3 class="text-base font-semibold text-dark font-heading">License types <span class="text-[#ff0000]">*</span></h3>

    <div class="space-y-6">
      {#each LICENSE_TYPES as license (license.id)}
        <LicenseTypeRow {license} store={workStore} />
      {/each}
    </div>
  </div>

  <!-- Fee Agreement -->
  <div class="flex justify-center">
    <label class="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onclick={toggleAgreement}
        class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
          {$workStore.licensing.agreedToFee ? 'bg-primary border-primary' : 'border-[#ddd] bg-white'}"
      >
        {#if $workStore.licensing.agreedToFee}
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

<!-- Buttons -->
<div class="flex justify-end gap-1.5 mt-12.5">
  {#if onSaveDraft}
    <button
      class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-cream border border-[#ddd] disabled:bg-[#e1dddb] text-dark cursor-pointer"
      onclick={onSaveDraft}
      disabled={$workStore.ui.loading}
    >
      Save as Draft
    </button>
  {/if}
  <button
    class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#e1dddb] text-cream cursor-pointer"
    onclick={() => (currentStep = 1)}
    disabled={$workStore.ui.loading}
  >
    Go back
  </button>
  <button
    class="text-sm font-medium rounded-sm h-9.5 px-7.5 {canContinue
      ? 'bg-primary cursor-pointer'
      : 'bg-[#e1dddb] cursor-not-allowed'} text-cream"
    onclick={() => canContinue && (currentStep = 3)}
    disabled={!canContinue}
  >
    Save and Continue
  </button>
</div>
