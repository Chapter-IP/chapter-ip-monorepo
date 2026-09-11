<script lang="ts">
  import { workStore } from '../stores/work-store'
  import { SCRIPT_FILE_EXTENSIONS } from '../constants/constants'
  import { extractTextFromFile } from '@repo/fe-services'
  import type { WorkFileKey } from '$lib/constants/workFileBuckets'
  import UploadImg from '$lib/assets/upload-icon.svg'
  import FileTile from '$lib/components/FileTile.svelte'

  let {
    bucket,
    title,
    subtitle,
  }: {
    bucket: WorkFileKey
    title: string
    subtitle?: string
  } = $props()

  const files = $derived($workStore.files[bucket])
  const existingFiles = $derived($workStore.existingFiles[bucket])
  const hasFiles = $derived(files.length > 0 || existingFiles.length > 0)
  const isSingleFile = $derived(bucket === 'preview-files' || $workStore.contentType === 'Lyrics')

  const accept = [...new Set(SCRIPT_FILE_EXTENSIONS.flatMap((ext) => [`.${ext}`, `.${ext.toUpperCase()}`]))].join(',')

  let fileInput: HTMLInputElement | null = $state(null)

  function appendAccepted(source: File[]) {
    const accepted = source.filter((file) =>
      SCRIPT_FILE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`)),
    )
    if (!accepted.length) return
    if (isSingleFile) {
      const current = files.length + existingFiles.length
      if (current >= 1) return
      const acceptedFiles = accepted.slice(0, 1 - current)
      workStore.appendMediaFiles(bucket, acceptedFiles)
      void extractSample(acceptedFiles[0], bucket === 'preview-files' ? 'preview file' : 'work file')
      return
    }
    workStore.appendMediaFiles(bucket, accepted)
    if ($workStore.contentType === 'Lyrics') {
      void extractSample(accepted[0], 'work file')
    }
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
    refreshSampleText()
  }

  function removeExistingFile(e: MouseEvent, index: number) {
    e.stopPropagation()
    workStore.removeExistingFile(bucket, index)
    refreshSampleText()
  }

  async function extractSample(file: File | undefined, label: string) {
    if (!file) {
      workStore.setSampleText(null)
      return
    }
    try {
      workStore.setSampleText(await extractTextFromFile(file))
    } catch (error) {
      console.error(`Failed to extract sample text from ${label}:`, error)
      workStore.setSampleText(null)
    }
  }

  function refreshSampleText() {
    if (bucket === 'preview-files') {
      void extractSample($workStore.files['preview-files'][0], 'preview file')
    } else if (bucket === 'works' && $workStore.contentType === 'Lyrics') {
      void extractSample($workStore.files.works[0], 'work file')
    }
  }
</script>

<div class="block">
  <div class="space-y-1.25 mb-8.75">
    <h1 class="text-sm font-semibold text-dark">Upload your sample content</h1>
    {#if subtitle}<p class="text-base leading-7.25 text-left text-[#72717b]">
        {subtitle}
      </p>{/if}
  </div>
  <div class="flex justify-between mb-2.75">
    <h2 class="text-sm text-[#707070] font-sans">
      {title}<span class="text-[#ff0000] ml-0.75"> *</span>
    </h2>
    <span class="text-sm text-[#f00]">* required</span>
  </div>

  <div
    class="border border-dashed rounded-lg border-[#1A1A2E33] p-8.75 flex flex-col items-center justify-center min-h-50"
    role="button"
    tabindex="0"
    aria-label={isSingleFile ? 'Upload your file' : 'Upload your files'}
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
          <FileTile name={file.name} onRemove={(e) => removeExistingFile(e, i)} />
        {/each}
        {#each files as file, i (file.name + i)}
          <FileTile name={file.name} onRemove={(e) => removeFile(e, i)} />
        {/each}

        {#if !(isSingleFile && files.length + existingFiles.length >= 1)}
          <button
            type="button"
            onclick={openPicker}
            class="h-20 w-20 rounded border-2 border-dashed border-[#1A1A2E33] flex items-center justify-center text-3xl text-[#aaa] hover:border-primary hover:text-primary transition-colors"
            >+</button
          >
        {/if}
      </div>
    {:else}
      <img src={UploadImg} alt="" class="w-6.5" />
      <p class="text-sm font-semibold text-dark mt-2">
        {isSingleFile ? 'Upload or drag your file' : 'Upload or drag your files'}
      </p>
      <button
        type="button"
        onclick={openPicker}
        class="rounded-sm border border-[#ddd] bg-cream mt-9 px-5 py-1.5 text-sm font-medium text-dark/60 hover:text-dark transition-colors"
      >
        {isSingleFile ? 'Upload your file' : 'Upload your files'}
      </button>
      <span class="text-[11px] text-center text-[#747474] w-full block mt-1">
        {isSingleFile ? 'One PDF, DOCX, TXT, EPUB, or MD file accepted' : 'PDF, DOCX, TXT, EPUB, MD files accepted'}
      </span>
    {/if}

    <input
      type="file"
      class="hidden"
      bind:this={fileInput}
      onchange={handleFileInput}
      {accept}
      multiple={!isSingleFile}
    />
  </div>
</div>
