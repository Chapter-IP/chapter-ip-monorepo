<script lang="ts">
  import { locationStore } from '../stores/location-store'
  import { LICENSE_TYPES } from '../constants/constants'
  import { modals, type ModalProps } from 'svelte-modals'
  import { ConfirmModal, type TConfirmModalProps } from '@repo/ui-components'
  import FileImg from '$lib/assets/file_img.svg'

  let {
    currentStep = $bindable(),
    onFormSubmit,
    onSaveDraft,
  }: {
    currentStep: number
    onFormSubmit: () => Promise<void>
    onSaveDraft?: () => Promise<void>
  } = $props()

  let mainPhoto: { src: string; name: string } | null = $state(null)
  let currentBlobUrl: string | null = null

  $effect(() => {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = null
    }

    if ($locationStore.previewImage) {
      currentBlobUrl = URL.createObjectURL($locationStore.previewImage)
      mainPhoto = { src: currentBlobUrl, name: 'Preview image' }
    } else if ($locationStore.existingPreviewUrl) {
      mainPhoto = { src: $locationStore.existingPreviewUrl, name: 'Preview image' }
    } else {
      mainPhoto = null
    }

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
        currentBlobUrl = null
      }
    }
  })
  const enabledLicenseTypes = $derived(
    LICENSE_TYPES.filter((license) => $locationStore.licensing.licenseTypes[license.id]),
  )
  const onSubmit = () => {
    modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
      title: 'Confirming your Location',
      description:
        "By publishing, you confirm that you have the legal right to license this location, that the terms you've set are accurate, and that a Content NFT will be minted on-chain representing this listing. This action is irreversible.",
      submitText: 'I understand and will continue',
      onSubmit: async () => {
        await onFormSubmit()
      },
    })
  }
</script>

<div class="space-y-12 mt-7.25 text-dark">
  <!-- Title Section -->
  <div class="pb-6">
    <h2 class="mb-2 text-[28px] font-medium text-left text-dark font-heading">Confirm your Location</h2>
    <p class="mt-3 text-base text-left text-[#72717b]">
      You're almost done. Before completing your location, take a moment to review the information you've provided.
    </p>
  </div>

  <!-- Review Card -->
  <div class="border border-dashed border-[#1a1a2e33] bg-cream rounded-lg p-6 md:p-10">
    <!-- Edit Details Button -->
    <div class="flex justify-end mb-6">
      <button
        disabled={$locationStore.ui.loading}
        onclick={() => (currentStep = 1)}
        class="bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
      >
        Edit details
      </button>
    </div>

    <!-- Location Name & Description -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-dark font-heading mb-3">{$locationStore.name || 'Untitled Location'}</h1>

      {#if $locationStore.description}
        <p class="text-base text-[#72717b] leading-relaxed max-w-3xl wrap-break-word">{$locationStore.description}</p>
      {/if}
    </div>

    <!-- Tags as filter pills -->
    {#if $locationStore.tags.length > 0}
      <div class="flex flex-wrap gap-2 mb-8">
        {#each $locationStore.tags as tag (tag)}
          <span class="px-4 py-1.5 rounded-full bg-[#eae6e2] border border-[#ddd] text-sm font-semibold text-dark/50">
            {tag}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Main Image -->
    <div class="mb-8">
      {#if mainPhoto}
        <div class="relative inline-block">
          <img
            src={mainPhoto.src}
            alt={mainPhoto.name}
            class="w-full max-w-md rounded-lg object-cover"
            style="max-height: 216px;"
          />
        </div>
      {:else}
        <div
          class="w-full max-w-md h-48 bg-[#eae6e2] rounded-lg flex items-center justify-center text-sm text-[#747474]"
        >
          No image uploaded
        </div>
      {/if}
    </div>

    <!-- Uploaded Location Files -->
    <div class="mb-8">
      <h2 class="text-lg font-semibold text-dark font-heading mb-4">Location files</h2>
      <div class="flex flex-wrap gap-2">
        {#each $locationStore.existingFiles.locations as file (file.id)}
          <div class="rounded bg-[#eae6e2] flex justify-center items-center text-[12px] text-[#71707a] py-2 px-3 gap-2">
            <img src={FileImg} alt="fileImg" class="h-4" />
            <span class="truncate w-full">{file.name}</span>
          </div>
        {/each}
        {#each $locationStore.files.locations as file (file.name)}
          <div class="rounded bg-[#eae6e2] flex justify-center items-center text-[12px] text-[#71707a] py-2 px-3 gap-2">
            <img src={FileImg} alt="fileImg" class="h-4" />
            <span class="truncate w-full">{file.name}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Licensing Types -->
    <div class="mb-6">
      <div class="flex justify-end mb-4">
        <button
          disabled={$locationStore.ui.loading}
          onclick={() => (currentStep = 2)}
          class="bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Edit licensing
        </button>
      </div>

      <h2 class="text-lg font-semibold text-dark font-heading mb-4">Licensing types</h2>
      <div class="flex flex-col gap-5">
        {#each enabledLicenseTypes as license (license.id)}
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
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
              <p class="text-[#747474] text-sm leading-relaxed pl-6">
                {license.description}
              </p>
            </div>
            <div class="shrink-0 text-right mt-0.5">
              <span class="text-sm font-semibold text-dark">
                $ {Number($locationStore.licensing.licensePrices[license.id] || 0).toLocaleString()}
              </span>
              <span class="text-[10px] text-[#7a7a8a] ml-1"> USD </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<!-- Buttons -->
<div class="flex justify-end gap-1.5 mt-12.5">
  {#if onSaveDraft}
    <button
      class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-cream border border-[#ddd] disabled:bg-[#e1dddb] text-dark cursor-pointer"
      disabled={$locationStore.ui.loading}
      onclick={onSaveDraft}
    >
      Save as Draft
    </button>
  {/if}
  <button
    class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#e1dddb] text-cream cursor-pointer"
    disabled={$locationStore.ui.loading}
    onclick={onSubmit}
  >
    {#if $locationStore.ui.loading}
      <div class="loading loading-dots"></div>
    {:else}
      Save and Publish
    {/if}
  </button>
</div>
