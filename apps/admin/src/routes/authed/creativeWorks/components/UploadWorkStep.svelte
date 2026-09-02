<script lang="ts">
  import { workStore } from '../stores/work-store'
  import { WORK_CONTENT_TYPES, GENRE_OPTIONS, SCRIPT_FILE_EXTENSIONS } from '../constants/constants'
  import UploadImg from '$lib/assets/upload-icon.svg'
  import PlusIcon from '$lib/components/icons/PlusIcon.svelte'
  import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte'

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

  const canContinueFromStepOne = $derived(
    Boolean(
      currentStep === 1 &&
      $workStore.title &&
      $workStore.contentType &&
      (!isFileContentType || ($workStore.files.works.length > 0 && $workStore.confirmations.rightsConfirmed)),
    ),
  )

  const scriptFileAccept = [
    ...new Set(SCRIPT_FILE_EXTENSIONS.flatMap((ext) => [`.${ext}`, `.${ext.toUpperCase()}`])),
  ].join(',')

  let scriptFileInput: HTMLInputElement | null = $state(null)

  function handleScriptFileInput(event: Event) {
    const target = event?.target as HTMLInputElement
    const files = Array.from(target?.files ?? [])
    const accepted = files.filter((file) =>
      SCRIPT_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`)),
    )
    if (accepted.length) workStore.appendMediaFiles('works', accepted)
    target.value = ''
  }

  function openScriptFilePicker(e: MouseEvent) {
    e.stopPropagation()
    scriptFileInput?.click()
  }

  function handleScriptDrop(event: DragEvent) {
    event.preventDefault()
    const files = Array.from(event.dataTransfer?.files ?? [])
    const accepted = files.filter((file) =>
      SCRIPT_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`)),
    )
    if (accepted.length) workStore.appendMediaFiles('works', accepted)
  }

  function handleScriptDragOver(event: DragEvent) {
    event.preventDefault()
  }

  function toggleRightsConfirmed() {
    workStore.setRightsConfirmed(!$workStore.confirmations.rightsConfirmed)
  }

  let newGenre = $state('')
  function addCustomGenre() {
    workStore.addGenre(newGenre)
    newGenre = ''
  }
  let genreInputActive = $state(false)

  function removeScriptFile(e: MouseEvent, index: number) {
    e.stopPropagation()
    workStore.removeMediaFile('works', index)
  }
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
          bind:value={$workStore.contentType}
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
        <div class="block space-y-3">
          <span class="mb-2 block text-sm text-[#72717b]">Genre</span>
          <div class="flex flex-wrap gap-2">
            {#each GENRE_OPTIONS as genre (genre)}
              <button
                type="button"
                onclick={() => workStore.toggleGenre(genre)}
                class="px-3.75 h-8.5 rounded-[14px] text-sm font-medium transition-colors border inline-flex items-center gap-1.5
                {$workStore.genre.includes(genre)
                  ? 'bg-primary border-primary text-cream'
                  : 'bg-[#eae6e2] border-[#71707a]/25 text-dark opacity-60 hover:opacity-100'}"
              >
                {genre}
                <PlusIcon class="shrink-0" />
              </button>
            {/each}
            {#each $workStore.genre.filter((g): g is string => !(GENRE_OPTIONS as readonly string[]).includes(g)) as custom (custom)}
              <button
                type="button"
                onclick={() => workStore.toggleGenre(custom)}
                class="px-3.75 h-8.5 rounded-[14px] text-sm font-medium transition-colors border inline-flex items-center gap-1.5 bg-primary border-primary text-cream"
              >
                {custom}
                <PlusIcon class="shrink-0" />
              </button>
            {/each}

            {#if genreInputActive}
              <div class="flex items-center gap-1">
                <input
                  type="text"
                  bind:value={newGenre}
                  placeholder="Add genre"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomGenre()
                    }
                  }}
                  class="w-32 h-8.5 rounded-[14px] border border-[#71707a]/25 bg-white px-3 text-sm text-dark outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onclick={addCustomGenre}
                  class="w-8.5 h-8.5 rounded-full bg-primary text-cream text-lg leading-none">+</button
                >
              </div>
            {:else}
              <button
                type="button"
                onclick={() => (genreInputActive = true)}
                class="px-3.75 h-8.5 rounded-[14px] text-sm font-medium bg-[#eae6e2] border border-[#71707a]/25 text-dark opacity-60 hover:opacity-100 inline-flex items-center gap-1.5"
              >
                Add
                <PlusIcon class="shrink-0" />
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Author(s) -->
      <div class="block space-y-3">
        <span class="mb-2 block text-sm text-[#72717b]">Author(s)</span>
        <div class="relative">
          <input
            type="text"
            bind:value={$workStore.author}
            placeholder="Author"
            class="w-full h-11.75 bg-white rounded border border-[#ddd] px-3.75 text-sm font-medium text-[#72717b]
            focus:border-primary focus:outline-none transition-shadow"
          />
          <button
            type="button"
            onclick={() => workStore.addCoAuthor($workStore.author)}
            disabled={!$workStore.author.trim()}
            class="mt-2.5 block ml-auto text-[13px] font-medium text-primary hover:underline disabled:text-[#ddd] disabled:no-underline"
          >
            Add a co-author
          </button>
        </div>
        {#if $workStore.coAuthors.length}
          <ul class="space-y-1.5 mt-2">
            {#each $workStore.coAuthors as coAuthor, i (coAuthor + i)}
              <li class="flex items-center text-sm text-[#72717b]">
                {coAuthor}
                <button
                  type="button"
                  onclick={() => workStore.removeCoAuthor(i)}
                  class="pl-2 text-xs text-[#72717b] hover:text-red-500">✕</button
                >
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Your Text File -->
      <div class="block space-y-3">
        <div class="flex justify-between">
          <span class="block text-sm text-[#72717b]">Your Text File <span class="text-[#ff0000]">*</span></span>
          <span class="text-sm text-[#f00]">* required</span>
        </div>

        <div
          class="border border-dashed rounded-lg border-[#1A1A2E33] p-4 bg-cream flex flex-col items-center justify-center min-h-50"
          role="button"
          tabindex="0"
          aria-label="Upload your text file"
          ondragover={handleScriptDragOver}
          ondrop={handleScriptDrop}
          onclick={openScriptFilePicker}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              scriptFileInput?.click()
            }
          }}
        >
          {#if $workStore.files.works.length}
            <div class="w-full flex flex-col items-center">
              {#each $workStore.files.works as file, i (file.name + i)}
                <div
                  class="flex items-center justify-between w-full max-w-80 rounded-sm border border-[#ddd] bg-white px-3 py-2 text-sm text-[#72717b]"
                >
                  <span class="truncate">{file.name}</span>
                  <button
                    type="button"
                    onclick={(e) => removeScriptFile(e, i)}
                    class="ml-2 text-xs text-[#72717b] hover:text-red-500">✕</button
                  >
                </div>
              {/each}
            </div>
          {:else}
            <img src={UploadImg} alt="" />
            <p class="text-sm font-semibold text-dark mt-2.5">Upload or drag your text file</p>
            <button
              type="button"
              onclick={openScriptFilePicker}
              class="rounded-sm border border-[#ddd] bg-cream mt-10.25 px-5 py-1.5 text-sm font-medium text-dark/60 hover:text-dark transition-colors"
            >
              Upload your text file
            </button>
            <span class="text-[11px] text-center text-[#747474] w-full block">
              PDF, DOCX, TXT, RTF, EPUB, MD files accepted
            </span>
          {/if}

          <input
            type="file"
            class="hidden"
            bind:this={scriptFileInput}
            onchange={handleScriptFileInput}
            accept={scriptFileAccept}
            multiple
          />
        </div>

        <label class="flex items-start gap-3 cursor-pointer">
          <button
            type="button"
            onclick={toggleRightsConfirmed}
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
            <span class="text-[#ff0000]">*</span> By uploading this content, you confirm that you are the author or rights
            holder and have the legal right to license it.
          </span>
        </label>
      </div>
    {/if}

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
