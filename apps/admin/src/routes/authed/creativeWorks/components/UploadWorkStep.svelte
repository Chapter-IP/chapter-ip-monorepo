<script lang="ts">
  import { workStore } from '../stores/work-store'
  import { WORK_CONTENT_TYPES } from '../constants/constants'

  let {
    currentStep = $bindable(),
    onSaveDraft,
  }: {
    currentStep: number
    onSaveDraft?: () => Promise<void>
  } = $props()

  const canContinueFromStepOne = $derived(Boolean(currentStep === 1 && $workStore.title && $workStore.contentType))
</script>

<div class="space-y-12 mt-7.25 text-dark">
  <!-- Title -->
  <div class="pb-6">
    <h2 class="mb-2 text-[22px] font-semibold text-left text-dark font-heading">Creative Works</h2>
    <p class="mt-3 text-base text-left text-[#72717b]">
      Add a written work to license for commercial and creative use. The details below are what creators see — and what
      every license is anchored to.
    </p>
    <p class="text-sm text-[#72717b] mt-4">
      <span class="text-[#ff0000]">* required</span> indicates required field
    </p>
  </div>

  <!-- Form -->
  <div class="space-y-6 max-w-137.5">
    <label class="block space-y-3">
      <span class="mb-2 block text-sm text-[#72717b]">Title <span class="text-[#ff0000]">*</span></span>
      <input
        type="text"
        bind:value={$workStore.title}
        placeholder="Title"
        class="w-full h-11.75 bg-white rounded border border-[#ddd] px-3.75 text-sm font-medium text-[#72717b]
          focus:border-primary focus:outline-none focus:shadow-[0_3px_6px_0_rgba(0,0,0,0.16)] transition-shadow"
      />
    </label>

    <label class="block space-y-3">
      <span class="mb-2 block text-sm text-[#72717b]">Content Type <span class="text-[#ff0000]">*</span></span>
      <div class="relative w-full">
        <select
          bind:value={$workStore.contentType}
          class="w-full h-11.75 bg-white rounded border border-[#ddd] px-3.75 pr-10 text-sm font-medium text-[#72717b]
            focus:border-primary focus:outline-none focus:shadow-[0_3px_6px_0_rgba(0,0,0,0.16)] transition-shadow appearance-none"
        >
          <option value="" disabled>Select one</option>
          {#each WORK_CONTENT_TYPES as type (type)}
            <option value={type}>{type}</option>
          {/each}
        </select>
        <svg
          class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="#72717b"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </label>
    <div class="flex justify-end gap-1.5 mt-12.5">
      {#if onSaveDraft}
        <button
          class="text-sm font-medium rounded h-9.5 px-7.5 bg-primary disabled:bg-[#1A1A2E4D] text-cream cursor-pointer"
          onclick={onSaveDraft}
          disabled={$workStore.ui.loading || !$workStore.title}
        >
          Save as Draft
        </button>
      {/if}
      {#if canContinueFromStepOne}
        <button
          class="text-sm font-medium rounded h-9.5 px-7.5 bg-primary disabled:bg-[#1A1A2E4D] text-cream cursor-pointer"
          onclick={() => (currentStep = 2)}
          disabled={$workStore.ui.loading}
        >
          Save and Continue
        </button>
      {:else}
        <button class="text-sm font-medium rounded h-9.5 px-7.5 bg-[#1A1A2E4D] text-cream cursor-not-allowed" disabled>
          Save and Continue
        </button>
      {/if}
    </div>
  </div>
</div>
