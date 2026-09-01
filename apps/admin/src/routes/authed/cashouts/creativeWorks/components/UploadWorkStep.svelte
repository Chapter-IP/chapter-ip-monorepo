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

  const canContinueFromStepOne = $derived(
    Boolean(
      currentStep === 1 &&
      $workStore.title &&
      $workStore.contentType &&
      ($workStore.files.works.length || $workStore.existingFiles.works.length) &&
      ($workStore.previewImage || $workStore.existingPreviewUrl) &&
      $workStore.confirmations.rightsConfirmed,
    ),
  )

  const supportedFileExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt']
  const supportedFileExtensionsWithUppercase = supportedFileExtensions.flatMap((extension) => [
    extension,
    extension.toUpperCase(),
  ])
  const supportedFileAccept = supportedFileExtensionsWithUppercase.join(',')

  let imageInput: HTMLInputElement | null = $state(null)
  let previewInput: HTMLInputElement | null = $state(null)

  const selectedFiles = $derived($workStore.files.works ?? [])
  const existingFiles = $derived($workStore.existingFiles.works ?? [])
  const hasMedia = $derived(selectedFiles.length > 0 || existingFiles.length > 0)

  function appendFiles(files: File[]) {
    const supportedFiles = files.filter((file) =>
      supportedFileExtensions.some((extension) => file.name.toLowerCase().endsWith(extension)),
    )
    if (!supportedFiles.length) return
    workStore.appendMediaFiles('works', supportedFiles)
  }

  function handleFileInput(event: Event) {
    const target = event?.target as HTMLInputElement
    const files = Array.from(target?.files ?? [])
    appendFiles(files)
    target.value = ''
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    const files = Array.from(event.dataTransfer?.files ?? [])
    appendFiles(files)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    imageInput?.click()
  }

  function openFilePicker(e: MouseEvent) {
    e.stopPropagation()
    imageInput?.click()
  }

  function openPreviewPicker(e: MouseEvent) {
    e.stopPropagation()
    previewInput?.click()
  }

  function handlePreviewInput(event: Event) {
    const target = event?.target as HTMLInputElement
    const file = target?.files?.[0]
    if (file) {
      workStore.setPreviewImage(file)
    }
    target.value = ''
  }

  function toggleRightsConfirmed() {
    workStore.setRightsConfirmed(!$workStore.confirmations.rightsConfirmed)
  }

  function removeFile(e: MouseEvent, index: number) {
    e.stopPropagation()
    workStore.removeMediaFile('works', index)
  }

  function removeExisting(e: MouseEvent, index: number) {
    e.stopPropagation()
    workStore.removeExistingFile('works', index)
  }
</script>

<div class="space-y-12 mt-7.25 text-dark">
  <!-- Title Section -->
  <div class="pb-6">
    <h2 class="mb-2 text-[28px] font-medium text-left text-dark font-heading">Creative Works</h2>
    <p class="mt-3 text-base text-left text-[#72717b]">
      Add a written work to license for commercial and creative use. The details below are what creators see — and what
      every license is anchored to.
    </p>
  </div>

  <!-- General Information -->
  <div class="space-y-6">
    <h3 class="text-base font-semibold text-left text-dark font-heading">General Information</h3>
    <p class="text-sm text-[#71707a] -mt-3"><span class="text-[#ff0000]">*</span> required indicates required field</p>

    <label class="block space-y-3">
      <span class="mb-2 block text-sm text-[#71707a]">Title <span class="text-[#ff0000]">*</span></span>
      <input
        type="text"
        bind:value={$workStore.title}
        placeholder="Title"
        class="w-full max-w-137.5 h-11.75 bg-white rounded-sm border border-[#ddd] px-3.75 text-sm font-medium text-[#71707a]
          focus:border-primary focus:outline-none focus:shadow-[0_3px_6px_0_rgba(0,0,0,0.16)] transition-shadow"
      />
    </label>

    <label class="block space-y-3">
      <span class="mb-2 block text-sm text-[#71707a]">Content Type <span class="text-[#ff0000]">*</span></span>
      <div class="relative w-full max-w-137.5">
        <select
          bind:value={$workStore.contentType}
          class="w-full h-11.75 bg-white rounded-sm border border-[#ddd] px-3.75 pr-10 text-sm font-medium text-[#71707a]
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
            stroke="#71707a"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </label>

    <label class="block space-y-3">
      <span class="mb-2 block text-sm text-[#71707a]">Description</span>
      <textarea
        bind:value={$workStore.description}
        placeholder="Description"
        class="w-full max-w-137.5 h-25 bg-white rounded-sm border border-[#ddd] px-3.75 py-3 text-sm font-medium text-[#71707a]
          focus:border-primary focus:outline-none resize-none"></textarea>
    </label>
  </div>

  <!-- Dashed divider -->
  <div class="border-t border-dashed border-[#ddd] mx-10"></div>

  <!-- Preview Image -->
  <div class="space-y-6">
    <h3 class="text-base font-semibold text-left text-dark font-heading">Preview Image</h3>
    <p class="text-base text-[#72717b] -mt-3">
      Add a preview image that will be shown to creators before they purchase.
    </p>

    <div class="space-y-1.25 w-full">
      <span class="text-sm text-[#71707a]">Preview Image <span class="text-[#ff0000]">*</span></span>

      <div
        class="border border-dashed min-h-32 rounded-lg border-[#1A1A2E33] p-4 bg-cream flex flex-col items-center justify-center gap-4"
        role="button"
        tabindex="0"
        aria-label="Upload preview image"
        onclick={openPreviewPicker}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            previewInput?.click()
          }
        }}
      >
        {#if $workStore.previewImage}
          <div class="relative">
            <img
              src={URL.createObjectURL($workStore.previewImage)}
              alt="Preview"
              class="h-24 w-24 rounded object-cover"
            />
            <button
              type="button"
              onclick={(e) => {
                e.stopPropagation()
                workStore.setPreviewImage(null)
              }}
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#ddd] text-[#71707a] hover:text-red-500 flex items-center justify-center text-xs transition-colors"
              >✕</button
            >
          </div>
        {:else if $workStore.existingPreviewUrl}
          <div class="relative">
            <img src={$workStore.existingPreviewUrl} alt="Preview" class="h-24 w-24 rounded object-cover" />
            <button
              type="button"
              onclick={(e) => {
                e.stopPropagation()
                workStore.setExistingPreviewUrl(null)
              }}
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#ddd] text-[#71707a] hover:text-red-500 flex items-center justify-center text-xs transition-colors"
              >✕</button
            >
          </div>
        {:else}
          <p class="text-sm text-[#747474]">Click to upload preview image</p>
          <button
            type="button"
            onclick={openPreviewPicker}
            class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
            >+</button
          >
        {/if}

        <input
          type="file"
          class="hidden"
          bind:this={previewInput}
          onchange={handlePreviewInput}
          accept=".jpeg,.jpg,.png,.webp"
        />
      </div>

      <span class="text-[10px] text-right text-[#747474] w-full block"> .jpeg, .jpg, .png, .webp files accepted </span>
    </div>
  </div>

  <!-- Dashed divider -->
  <div class="border-t border-dashed border-[#ddd] mx-10"></div>

  <!-- Creative Work Upload -->
  <div class="space-y-6">
    <h3 class="text-lg font-semibold text-left text-dark font-heading">Creative Work</h3>
    <p class="text-base text-[#72717b] -mt-3">
      Upload your written work. This is the asset creators license, with provenance baked in.
    </p>

    <div class="space-y-1.25 w-full">
      <span class="text-sm text-[#71707a]">File <span class="text-[#ff0000]">*</span></span>

      <div
        class="border border-dashed min-h-62.5 rounded-lg border-[#1A1A2E33] p-4 bg-cream flex flex-col items-center justify-center gap-4"
        role="button"
        tabindex="0"
        aria-label="Upload creative work"
        ondragover={handleDragOver}
        ondrop={handleDrop}
        onkeydown={handleKeyDown}
      >
        {#if hasMedia}
          <div class="w-full flex flex-wrap gap-2 justify-center py-2">
            {#each existingFiles as file, i (`existing-${file.id}`)}
              <div class="relative">
                <div
                  class="h-20 w-20 rounded bg-[#eae6e2] flex flex-col items-center justify-center text-[10px] text-[#71707a] leading-tight text-center py-1 px-2"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="mb-1 shrink-0">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                      stroke="#71707a"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M14 2v6h6M4 18h16M12 17l-2.5-2.5M12 17l2.5-2.5"
                      stroke="#71707a"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span class="truncate w-full">{file.name}</span>
                </div>
                <button
                  type="button"
                  onclick={(e) => removeExisting(e, i)}
                  class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#ddd] text-[#71707a] hover:text-red-500 flex items-center justify-center text-xs transition-colors"
                  >✕</button
                >
              </div>
            {/each}
            {#each selectedFiles as file, i (file.name + i)}
              <div class="relative">
                <div
                  class="h-20 w-20 rounded bg-[#eae6e2] flex flex-col items-center justify-center text-[10px] text-[#71707a] leading-tight text-center py-1 px-2"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="mb-1 shrink-0">
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                      stroke="#71707a"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M14 2v6h6M4 18h16M12 17l-2.5-2.5M12 17l2.5-2.5"
                      stroke="#71707a"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span class="truncate w-full">{file.name}</span>
                </div>
                <button
                  type="button"
                  onclick={(e) => removeFile(e, i)}
                  class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#ddd] text-[#71707a] hover:text-red-500 flex items-center justify-center text-xs transition-colors"
                  >✕</button
                >
              </div>
            {/each}

            <button
              type="button"
              onclick={openFilePicker}
              class="h-20 w-20 rounded border-2 border-dashed border-[#1A1A2E33] flex items-center justify-center text-3xl text-[#aaa] hover:border-primary hover:text-primary transition-colors"
              >+</button
            >
          </div>
        {:else}
          <p class="text-base font-semibold text-dark">Upload your written work</p>
          <button
            type="button"
            onclick={openFilePicker}
            class="w-10.5 h-10.5 rounded-full bg-primary text-white flex items-center justify-center text-4xl hover:opacity-90 transition-opacity"
            >+</button
          >
        {/if}

        <input
          type="file"
          class="hidden"
          bind:this={imageInput}
          onchange={handleFileInput}
          accept={supportedFileAccept}
          multiple
        />
      </div>

      <span class="text-[10px] text-right text-[#747474] w-full block">
        .pdf, .doc, .docx, .txt, .md, .rtf, .odt files accepted
      </span>
    </div>
  </div>

  <!-- Legal disclaimer -->
  <div class="flex justify-center">
    <label class="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onclick={toggleRightsConfirmed}
        class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
          {$workStore.confirmations.rightsConfirmed ? 'bg-primary border-primary' : 'border-[#ddd] bg-white'}"
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
      <span class="text-sm font-medium text-left text-[#747474]">
        By uploading this content, you confirm that you are the author or rights holder and have the legal right to
        license it.<span class="text-[#ff0000]">*</span>
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
  {#if canContinueFromStepOne}
    <button
      class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#e1dddb] text-cream cursor-pointer"
      onclick={() => (currentStep = 2)}
      disabled={$workStore.ui.loading}
    >
      Save and Continue
    </button>
  {:else}
    <button class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-[#e1dddb] text-cream cursor-not-allowed" disabled>
      Save and Continue
    </button>
  {/if}
</div>
