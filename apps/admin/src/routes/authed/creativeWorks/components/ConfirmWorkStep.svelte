<script lang="ts">
  import { workStore } from '../stores/work-store'
  import { ADDITIONAL_TERMS, LICENSE_TYPES, PERMITTED_USES } from '../constants/constants'
  import { modals, type ModalProps } from 'svelte-modals'
  import { ConfirmModal, type TConfirmModalProps } from '@repo/ui-components'
  import { extractTextFromFile } from '@repo/fe-services'
  import { onMount } from 'svelte'
  import WarningIcon from '$lib/assets/warning-icon.svg'
  import Arrow from '$lib/assets/arrow-down-left.svg'

  let {
    currentStep = $bindable(),
    onFormSubmit,
    onSaveDraft,
  }: {
    currentStep: number
    onFormSubmit: () => Promise<void>
    onSaveDraft?: () => Promise<void>
  } = $props()

  const enabledLicenseTypes = $derived(LICENSE_TYPES.filter((license) => $workStore.licensing.licenseTypes[license.id]))
  const enabledPermittedUses = $derived(PERMITTED_USES.filter((use) => $workStore.licensing.permittedUses[use.id]))
  const enabledAdditionalTerms = $derived(ADDITIONAL_TERMS.filter((term) => $workStore.licensing[term.key]))
  let sampleExpanded = $state(false)

  function extractFromFile(file: File, label: string) {
    extractTextFromFile(file)
      .then((text) => workStore.setSampleText(text))
      .catch((error) => console.error(`Failed to extract sample text from ${label}:`, error))
  }

  function extractFromUrl(file: { name: string; url: string }, label: string) {
    fetch(file.url)
      .then((response) => {
        if (!response.ok) throw new Error(`Preview fetch failed: ${response.status}`)
        return response.blob()
      })
      .then((blob) => extractTextFromFile(new File([blob], file.name, { type: blob.type })))
      .then((text) => workStore.setSampleText(text))
      .catch((error) => console.error(`Failed to extract sample text from ${label}:`, error))
  }

  onMount(() => {
    if ($workStore.sampleText) return

    const previewFile = $workStore.files['preview-files']?.[0]
    const existingPreview = $workStore.existingFiles['preview-files']?.[0]

    if (previewFile) {
      extractFromFile(previewFile, 'preview file')
      return
    }

    if (existingPreview?.url) {
      extractFromUrl(existingPreview, 'existing preview')
      return
    }

    if ($workStore.contentType !== 'Lyrics') return

    const workFile = $workStore.files.works?.[0]
    const existingWork = $workStore.existingFiles.works?.[0]

    if (workFile) {
      extractFromFile(workFile, 'work file')
      return
    }

    if (existingWork?.url) {
      extractFromUrl(existingWork, 'existing work file')
    }
  })
  const onSubmit = () => {
    modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
      title: 'Confirming your Creative Work',
      description:
        "By publishing, you confirm that you have the legal right to license this written work, that the terms you've set are accurate, and that a Content NFT will be minted on-chain representing this listing. This action is irreversible.",
      submitText: 'I understand and will continue',
      onSubmit: async () => {
        await onFormSubmit()
      },
    })
  }
</script>

<div class="space-y-5.5 mt-11 text-dark">
  <!-- Title Section -->
  <div>
    <h2 class="text-[22px] font-semibold text-left text-dark font-heading">Confirm your Creative Work</h2>
    <p class="text-base text-left text-[#72717b]">
      You're almost done. Before completing your written work, take a moment to review the information you've provided.
    </p>
  </div>

  <!-- Review Card -->
  <div class="border border-dashed border-[#1a1a2e33] bg-cream rounded-lg py-5.5 px-5 sm:px-13.25">
    <!-- Edit Details Button -->
    <div class="flex justify-end mb-7.75">
      <button
        disabled={$workStore.ui.loading}
        onclick={() => (currentStep = 1)}
        class="bg-primary text-white rounded-sm px-7.5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        Edit details
      </button>
    </div>

    <!-- Title & Description -->
    <div class="mb-7.5">
      <h1 class="text-2xl font-semibold text-dark">
        {$workStore.title || 'Untitled Work'}
      </h1>
      <p class="text-sm text-[#72717b]">
        {$workStore.contentType}{$workStore.authors.length ? ` by ${$workStore.authors.join(', ')}` : ''}
      </p>
      {#if $workStore.contentType === 'Script' && $workStore.genre.length > 0}
        <div class="flex flex-wrap mt-2.5 gap-1.5">
          {#each $workStore.genre as g (g)}
            <span
              class="h-7.25 px-6 inline-flex items-center justify-center rounded-full text-base font-semibold text-dark/50 bg-[#eae6e2]"
            >
              {g}
            </span>
          {/each}
        </div>
      {/if}
    </div>

    {#if $workStore.contentType === 'Script' && $workStore.description}
      <p class="mb-8 whitespace-pre-line text-base leading-7 text-[#72717b] wrap-break-word">
        {$workStore.description}
      </p>
    {/if}
    <!-- Sample Preview -->
    {#if $workStore.sampleText}
      <div class="mb-7.5">
        <p class="text-base text-[#72717b] leading-7 {sampleExpanded ? '' : 'line-clamp-12'}">
          {$workStore.sampleText}
        </p>
        <div class="mt-7.25 flex items-center gap-2">
          <button
            type="button"
            onclick={() => (sampleExpanded = !sampleExpanded)}
            class="inline-flex items-center gap-1.5 text-base bg-transparent cursor-pointer text-primary"
          >
            <div class="flex gap-2 items-center">
              <img src={WarningIcon} alt="" class="size-4 shrink-0" />
              {sampleExpanded ? 'Read less' : 'Read full sample'}
              <img src={Arrow} alt="" class=" shrink-0 {sampleExpanded ? '-rotate-45' : '-rotate-135'}" />
            </div>
          </button>
        </div>
      </div>
    {/if}
    <div class="flex justify-end mb-7.5">
      <button
        disabled={$workStore.ui.loading}
        onclick={() => (currentStep = 2)}
        class="bg-primary text-white rounded-sm px-7.5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        Edit licensing
      </button>
    </div>

    <!-- Licensing Types -->
    <div class="mb-6">
      <h2 class="text-lg font-heading mb-3 font-medium text-dark">Licensing types</h2>
      <div class="flex flex-col gap-5">
        {#each enabledLicenseTypes as license (license.id)}
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="#6734FF"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span class="font-semibold text-dark">{license.label}</span>
              </div>
              <p class="pl-5 text-base font-medium text-[#747474] max-w-132.5">
                {license.description}
              </p>
            </div>
            <div class="shrink-0 text-[#30364b] mt-0.75">
              <span class="text-sm font-medium text-dark">
                $ {Number($workStore.licensing.licensePrices[license.id] || 0).toLocaleString('en-US')}
              </span>
              <span class="text-[10px] text-[#7a7a8a] ml-1"> USD </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
    <!-- Permitted uses -->
    {#if enabledPermittedUses.length > 0}
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-dark font-heading mb-3">Permitted uses</h2>
        <div class="flex flex-col">
          {#each enabledPermittedUses as use (use.id)}
            <p class="text-[#747474] text-sm leading-relaxed pl-6">
              {use.label}
            </p>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Additional information -->
    {#if enabledAdditionalTerms.length > 0}
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-dark font-heading mb-3">Additional information</h2>
        <div class="flex flex-col">
          {#each enabledAdditionalTerms as term (term.key)}
            <p class="text-[#747474] text-sm leading-relaxed pl-6">
              {term.label}
            </p>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Buttons -->
<div class="flex justify-end gap-1.5 mt-12.5">
  {#if onSaveDraft}
    <button
      class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-cream border border-[#ddd] disabled:bg-[#e1dddb] text-dark cursor-pointer"
      disabled={$workStore.ui.loading}
      onclick={onSaveDraft}
    >
      Save as Draft
    </button>
  {/if}
  <button
    class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#e1dddb] text-cream cursor-pointer"
    disabled={$workStore.ui.loading}
    onclick={onSubmit}
  >
    {#if $workStore.ui.loading}
      <div class="loading loading-dots"></div>
    {:else}
      Save and Publish
    {/if}
  </button>
</div>
