<script lang="ts">
  import { workStore } from '../stores/work-store'
  import { WORK_CONTENT_TYPES } from '../constants/constants'
  import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte'
  import GenreField from './GenreField.svelte'
  import AuthorsField from './AuthorsField.svelte'
  import WorkFileDropzone from './WorkFileDropzone.svelte'

  let {
    currentStep = $bindable(),
    onSaveDraft,
  }: {
    currentStep: number
    onSaveDraft?: () => Promise<void>
  } = $props()

  const isScript = $derived($workStore.contentType === 'Script')
  const isLyrics = $derived($workStore.contentType === 'Lyrics')
  const isFileContentType = $derived(isScript || isLyrics)

  const hasWorkFiles = $derived($workStore.files.works.length > 0 || ($workStore.existingFiles.works ?? []).length > 0)
  const hasPreviewFiles = $derived(
    $workStore.files['preview-files'].length > 0 || ($workStore.existingFiles['preview-files'] ?? []).length > 0,
  )

  const canContinueFromStepOne = $derived(
    Boolean(
      currentStep === 1 &&
      $workStore.title &&
      $workStore.contentType &&
      (!isFileContentType ||
        (hasWorkFiles && (!isScript || hasPreviewFiles) && $workStore.confirmations.rightsConfirmed)),
    ),
  )

  function handleContentTypeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value
    if (value !== 'Script') workStore.clearPreviewFiles()
    workStore.setContentType(value)
  }
</script>

<div class="space-y-12 mt-7.25 text-dark">
  <!-- Title -->
  <div>
    <h2 class="mb-2 text-[22px] font-semibold text-left text-dark font-heading">Creative Works</h2>
    <p class="mt-3 text-base text-left text-[#72717b]">
      Add a written work to license for commercial and creative use. The details below are what creators see — and what
      every license is anchored to.
    </p>
  </div>

  <!-- Form -->
  <div class="space-y-6 max-w-137.5">
    <label class="block space-y-3">
      <div class="flex justify-between">
        <span class=" block text-sm text-[#72717b]">Title <span class="text-[#ff0000]">*</span></span>
        <span class="text-sm text-[#f00]">* required</span>
      </div>
      <input
        type="text"
        bind:value={$workStore.title}
        placeholder="Title"
        class="w-full h-11.75 bg-white rounded border border-[#ddd] px-3.75 text-sm font-medium text-[#72717b]
          focus:border-primary focus:outline-none focus:shadow-[0_3px_6px_0_rgba(0,0,0,0.16)] transition-shadow"
      />
    </label>

    <label class="block space-y-3">
      <div class="flex justify-between">
        <span class=" block text-sm text-[#72717b]">Content Type <span class="text-[#ff0000]">*</span></span>
        <span class="text-sm text-[#f00]">* required</span>
      </div>
      <div class="relative w-full">
        <select
          value={$workStore.contentType}
          onchange={handleContentTypeChange}
          class="w-full h-11.75 bg-white rounded border border-[#ddd] px-3.75 pr-10 text-sm font-medium text-[#72717b]
            focus:border-primary focus:outline-none focus:shadow-[0_3px_6px_0_rgba(0,0,0,0.16)] transition-shadow appearance-none"
        >
          <option value="" disabled>Select one</option>
          {#each WORK_CONTENT_TYPES as type (type)}
            <option value={type}>{type}</option>
          {/each}
        </select>
        <ChevronDownIcon color="#72717b" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </label>

    {#if isScript || isLyrics}
      <!-- Description -->
      <label class="block space-y-3">
        <span class="mb-2 block text-sm text-[#72717b]">Description</span>
        <textarea
          bind:value={$workStore.description}
          placeholder="Description"
          class="w-full h-25 bg-white rounded border border-[#ddd] px-3.75 py-3 text-sm font-medium text-[#72717b]
            focus:border-primary focus:outline-none focus:shadow-[0_3px_6px_0_rgba(0,0,0,0.16)] resize-none transition-shadow"
        ></textarea>
      </label>

      {#if isScript}
        <!-- Genre -->
        <GenreField
          value={$workStore.genre}
          onToggle={(genre) => workStore.toggleGenre(genre)}
          onAdd={(genre) => workStore.addGenre(genre)}
        />
      {/if}

      <!-- Author(s) -->
      <AuthorsField
        authors={$workStore.authors}
        onAdd={(name) => workStore.addAuthor(name)}
        onRemove={(i) => workStore.removeAuthor(i)}
      />

      {#if isScript}
        <!-- Preview File -->
        <WorkFileDropzone bucket="preview-files" title="Your Sample content" required />
      {/if}
      <!-- Your Text File -->
      <WorkFileDropzone bucket="works" title="Your Creative Work" required />

      <!-- Rights Confirmation -->
      <label class="flex items-start gap-3 cursor-pointer">
        <button
          type="button"
          onclick={() => workStore.setRightsConfirmed(!$workStore.confirmations.rightsConfirmed)}
          class="w-4 h-4 shrink-0 rounded-[3px] border flex items-center justify-center transition-colors mt-0.5
            {$workStore.confirmations.rightsConfirmed ? 'bg-primary border-primary' : 'bg-[#eae6e2] border-[#ddd]'}"
        >
          {#if $workStore.confirmations.rightsConfirmed}
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
        <span class="text-xs font-medium leading-4.5 text-[#747474]">
          <span class="text-[#ff0000]">*</span> By uploading this content, you confirm that you are the author or rights holder
          and have the legal right to license it.
        </span>
      </label>
    {/if}

    <div class="flex justify-end gap-1.5 mt-12.5">
      {#if onSaveDraft}
        <button
          class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#1A1A2E4D] text-cream cursor-pointer"
          onclick={onSaveDraft}
          disabled={$workStore.ui.loading || !$workStore.title}
        >
          Save as Draft
        </button>
      {/if}
      {#if canContinueFromStepOne}
        <button
          class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#1A1A2E4D] text-cream cursor-pointer"
          onclick={() => (currentStep = 2)}
          disabled={$workStore.ui.loading}
        >
          Save and Continue
        </button>
      {:else}
        <button
          class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-[#1A1A2E4D] text-cream cursor-not-allowed"
          disabled
        >
          Save and Continue
        </button>
      {/if}
    </div>
  </div>
</div>
