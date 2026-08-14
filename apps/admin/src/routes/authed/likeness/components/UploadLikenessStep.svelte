<script lang="ts">
  import { likenessStore } from '../stores/likeness-store'
  import MediaUpload from './MediaUpload.svelte'
  import LikenessDetails from './LikenessDetails.svelte'
  import { MEDIA_UPLOAD_GUIDELINES } from '../constants/constants'

  let {
    currentStep = $bindable(),
    onSaveDraft,
  }: {
    currentStep: number
    onSaveDraft?: () => Promise<void>
  } = $props()
  const canContinueFromStepOne = $derived(
    Boolean(
      $likenessStore.profile.fullLegalName &&
      $likenessStore.profile.bio &&
      ($likenessStore.files.headshots.length || $likenessStore.existingFiles.headshots.length) &&
      $likenessStore.confirmations.rightsConfirmed,
    ),
  )
</script>

{#snippet fieldLabel(text: string)}
  <div class="flex justify-between">
    <span class="mb-2 block text-sm text-[#71707a]">{text}</span>
    <p class="text-sm text-[#f00]">* required</p>
  </div>
{/snippet}
{#snippet divider()}
  <div class="border-t border-[#ddd] mb-12.25 mx-auto max-w-6xl md:px-35"></div>
{/snippet}

<div class="space-y-12 mt-7.25 text-dark">
  <div class="space-y-8 max-w-137.5">
    <div>
      <h2 class="mb-2 text-[28px] font-medium text-left text-dark">Upload your likeness</h2>
      <p class="mt-3 text-base text-left text-[#72717b]">
        Describe the asset clearly so the next licensing step has the right context.
      </p>
      <p class="text-sm text-[#72717b] mt-4.5"><span class="text-[#f00]">* required</span> indicates required field</p>
    </div>
    <div class="space-y-6">
      <h3 class="text-base font-semibold text-left">General Information</h3>

      <label class="block space-y-2.5">
        {@render fieldLabel('Full Legal Name')}
        <input
          id="full-legal-name"
          type="text"
          bind:value={$likenessStore.profile.fullLegalName}
          placeholder="Your legal name"
          class="w-full h-11.75 bg-white rounded-sm border border-[#ddd4cc] p-3.75 focus:border-primary focus:outline-none
         opacity-0.3 text-sm font-medium text-left text-[#71707a]"
        />
      </label>

      <label class="block space-y-3">
        <span class="mb-2 block text-sm text-[#71707a]">Stage Name</span>
        <input
          id="stage-name"
          type="text"
          bind:value={$likenessStore.profile.stageName}
          placeholder="Your stage name"
          class="w-full h-11.75 bg-white rounded-sm border border-[#ddd4cc] p-3.75 focus:border-primary focus:outline-none
         opacity-0.3 text-sm font-medium text-left text-[#71707a]"
        />
      </label>

      <label class="block space-y-3">
        {@render fieldLabel('Bio')}
        <textarea
          id="bio"
          bind:value={$likenessStore.profile.bio}
          placeholder="Bio"
          class="w-full h-25 bg-white rounded-sm border border-[#ddd4cc] p-3.75 focus:border-primary focus:outline-none
         opacity-0.3 text-sm font-medium text-left text-[#71707a]"></textarea>
      </label>
    </div>
  </div>

  {@render divider()}

  <LikenessDetails>{@render divider()}</LikenessDetails>

  {@render divider()}

  <div class="max-w-137.5 mb-20.75">
    <div class="space-y-8.75">
      {#each MEDIA_UPLOAD_GUIDELINES as guideline (guideline.fileKey)}
        <MediaUpload
          label={guideline.label}
          fileKey={guideline.fileKey}
          mediaKind={guideline.mediaKind}
          required={guideline.required}
          descriptions={guideline.description}
          header={guideline.header}
          headerLink={guideline.headerLink}
        />
      {/each}
    </div>
  </div>

  {@render divider()}

  <div class="flex justify-center">
    <label class="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onclick={() => likenessStore.setRightsConfirmed(!$likenessStore.confirmations.rightsConfirmed)}
        class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
            {$likenessStore.confirmations.rightsConfirmed ? 'bg-primary border-primary' : 'border-[#ddd] bg-white'}"
      >
        {#if $likenessStore.confirmations.rightsConfirmed}
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
      <span class="text-sm font-medium text-left text-[#747474]">
        By uploading this content, you confirm that you are the author or rights holder and have the legal right to
        license it.<span class="text-[#ff0000]">*</span>
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
  {#if canContinueFromStepOne}
    <button
      class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#e1dddb] text-cream"
      onclick={() => (currentStep = 2)}
      disabled={$likenessStore.ui.loading}
    >
      Save and Continue
    </button>
  {/if}
</div>
