<script lang="ts">
  import { workStore } from '../stores/work-store'
  import { SCRIPT_FILE_EXTENSIONS } from '../constants/constants'
  import type { WorkFileKey } from '$lib/constants/workFileBuckets'
  import UploadImg from '$lib/assets/upload-icon.svg'
  import FileTile from '$lib/components/FileTile.svelte'

  let {
    bucket,
    title,
    subtitle,
    required = false,
  }: {
    bucket: WorkFileKey
    title: string
    subtitle?: string
    required?: boolean
  } = $props()

  const files = $derived($workStore.files[bucket])
  const existingFiles = $derived($workStore.existingFiles[bucket])
  const hasFiles = $derived(files.length > 0 || existingFiles.length > 0)

  const accept = [...new Set(SCRIPT_FILE_EXTENSIONS.flatMap((ext) => [`.${ext}`, `.${ext.toUpperCase()}`]))].join(',')

  let fileInput: HTMLInputElement | null = $state(null)

  function appendAccepted(source: File[]) {
    const accepted = source.filter((file) =>
      SCRIPT_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`)),
    )
    if (accepted.length) workStore.appendMediaFiles(bucket, accepted)
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
    workStore.removeMediaFile(bucket, index)
  }
</script>

<div class="block space-y-3">
  <h1 class="text-sm font-semibold text-dark">Upload your sample content</h1>
  <p class="text-base text-[#72717b]">{subtitle}</p>
  <div class="flex justify-between">
    <span class="block text-sm text-[#72717b]"
      >{title}{#if required}
        <span class="text-[#ff0000]">*</span>{/if}</span
    >
    {#if required}
      <span class="text-sm text-[#f00]">* required</span>
    {/if}
  </div>

  <div
    class="border border-dashed rounded-lg border-[#1A1A2E33] p-4 bg-cream flex flex-col items-center justify-center min-h-50"
    role="button"
    tabindex="0"
    aria-label="Upload your files"
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
              workStore.removeExistingFile(bucket, i)
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
      <p class="text-sm font-semibold text-dark mt-2.5">Upload or drag your files</p>
      <button
        type="button"
        onclick={openPicker}
        class="rounded-sm border border-[#ddd] bg-cream mt-10.25 px-5 py-1.5 text-sm font-medium text-dark/60 hover:text-dark transition-colors"
      >
        Upload your files
      </button>
      <span class="text-[11px] text-center text-[#747474] w-full block">
        PDF, DOCX, TXT, RTF, EPUB, MD files accepted
      </span>
    {/if}

    <input type="file" class="hidden" bind:this={fileInput} onchange={handleFileInput} {accept} multiple />
  </div>
</div>
