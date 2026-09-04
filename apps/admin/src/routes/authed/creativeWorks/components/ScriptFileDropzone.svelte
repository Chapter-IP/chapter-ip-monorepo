<script lang="ts">
  import { workStore } from '../stores/work-store'
  import { SCRIPT_FILE_EXTENSIONS } from '../constants/constants'
  import UploadImg from '$lib/assets/upload-icon.svg'
  import FileTile from '$lib/components/FileTile.svelte'

  let {
    confirmed,
    onToggleConfirmed,
  }: {
    confirmed: boolean
    onToggleConfirmed: () => void
  } = $props()

  const files = $derived($workStore.files.works)
  const existingFiles = $derived($workStore.existingFiles.works ?? [])
  const hasFiles = $derived(files.length > 0 || existingFiles.length > 0)

  const accept = [...new Set(SCRIPT_FILE_EXTENSIONS.flatMap((ext) => [`.${ext}`, `.${ext.toUpperCase()}`]))].join(',')

  let fileInput: HTMLInputElement | null = $state(null)

  function appendAccepted(source: File[]) {
    const accepted = source.filter((file) =>
      SCRIPT_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`)),
    )
    if (accepted.length) workStore.appendMediaFiles('works', accepted)
  }

  function openPicker(e: MouseEvent) {
    e.stopPropagation()
    fileInput?.click()
  }

  function handleFileInput(event: Event) {
    const target = event?.target as HTMLInputElement
    appendAccepted(Array.from(target?.files ?? []))
    target.value = ''
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    appendAccepted(Array.from(event.dataTransfer?.files ?? []))
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
  }

  function removeFile(e: MouseEvent, index: number) {
    e.stopPropagation()
    workStore.removeMediaFile('works', index)
  }
</script>

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
    ondragover={handleDragOver}
    ondrop={handleDrop}
    onclick={openPicker}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fileInput?.click()
      }
    }}
  >
    {#if hasFiles}
      <div class="w-full flex flex-wrap gap-2 justify-center py-2">
        {#each existingFiles as file, i (`existing-${file.id}`)}
          <FileTile
            name={file.name}
            onRemove={(e) => {
              e.stopPropagation()
              workStore.removeExistingFile('works', i)
            }}
          />
        {/each}
        {#each files as file, i (file.name + i)}
          <FileTile name={file.name} onRemove={(e) => removeFile(e, i)} />
        {/each}

        <button
          type="button"
          onclick={openPicker}
          class="h-20 w-20 rounded border-2 border-dashed border-[#1A1A2E33] flex items-center justify-center text-3xl text-[#aaa] hover:border-primary hover:text-primary transition-colors"
          >+</button
        >
      </div>
    {:else}
      <img src={UploadImg} alt="" />
      <p class="text-sm font-semibold text-dark mt-2.5">Upload or drag your text file</p>
      <button
        type="button"
        onclick={openPicker}
        class="rounded-sm border border-[#ddd] bg-cream mt-10.25 px-5 py-1.5 text-sm font-medium text-dark/60 hover:text-dark transition-colors"
      >
        Upload your text file
      </button>
      <span class="text-[11px] text-center text-[#747474] w-full block"> PDF, DOCX, TXT, EPUB, MD files accepted </span>
    {/if}

    <input type="file" class="hidden" bind:this={fileInput} onchange={handleFileInput} {accept} multiple />
  </div>

  <label class="flex items-start gap-3 cursor-pointer">
    <button
      type="button"
      onclick={onToggleConfirmed}
      class="w-4 h-4 shrink-0 rounded-[3px] border flex items-center justify-center transition-colors mt-0.5
        {confirmed ? 'bg-primary border-primary' : 'bg-[#eae6e2] border-[#ddd]'}"
    >
      {#if confirmed}
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      {/if}
    </button>
    <span class="text-xs font-medium leading-4.5 text-[#747474]">
      <span class="text-[#ff0000]">*</span> By uploading this content, you confirm that you are the author or rights holder
      and have the legal right to license it.
    </span>
  </label>
</div>
