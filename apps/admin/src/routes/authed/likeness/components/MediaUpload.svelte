<script lang="ts">
  import { likenessStore } from '../stores/likeness-store'

  type MediaFileKey = 'headshots' | 'bodyShots' | 'voiceSamples' | 'videoReels'
  type MediaKind = 'image' | 'audio' | 'video'

  let imageInput: HTMLInputElement | null = $state(null)
  let {
    label,
    required = false,
    fileKey = 'headshots',
    mediaKind = 'image',
    multiple = true,
    descriptions = '',
    header,
    headerLink,
  } = $props<{
    label: string
    required?: boolean
    fileKey?: MediaFileKey
    mediaKind?: MediaKind
    multiple?: boolean
    descriptions?: string
    header?: string
    headerLink?: { text: string; onClick: () => void }
  }>()

  const accept = $derived(mediaKind === 'image' ? 'image/*' : mediaKind === 'audio' ? 'audio/*' : 'video/*')
  const helperText = $derived(
    mediaKind === 'image'
      ? '.avif, .gif, .jpg, .png, .svg, .webp files accepted'
      : mediaKind === 'audio'
        ? '.mp3, .wav, .m4a, .aac files accepted'
        : '.mp4, .mov, .webm files accepted',
  )
  const emptyStateText = $derived(
    mediaKind === 'image'
      ? `Upload or drag your ${label.toLowerCase()}`
      : `Upload or drag your ${label.toLowerCase()} file`,
  )

  const selectedFiles = $derived($likenessStore.files[fileKey as MediaFileKey] ?? [])
  const existingFiles = $derived($likenessStore.existingFiles[fileKey as MediaFileKey] ?? [])
  const hasMedia = $derived(selectedFiles.length > 0 || existingFiles.length > 0)

  function appendFiles(files: File[]) {
    if (!files.length) return

    const allValid = files.every(
      (file) =>
        (mediaKind === 'image' && file.type.startsWith('image/')) ||
        (mediaKind === 'audio' && file.type.startsWith('audio/')) ||
        (mediaKind === 'video' && file.type.startsWith('video/')),
    )

    if (!allValid) {
      alert(`Please select valid ${mediaKind} files`)
      return
    }

    likenessStore.appendMediaFiles(fileKey, files)
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

  function removeFile(e: MouseEvent, index: number) {
    e.stopPropagation()
    likenessStore.removeMediaFile(fileKey, index)
  }

  function removeExisting(e: MouseEvent, index: number) {
    e.stopPropagation()
    likenessStore.removeExistingFile(fileKey, index)
  }
</script>

<div class="space-y-1.25 w-full">
  {#if header}
    <h3 class="text-base font-semibold text-dark mb-5">{header}</h3>
  {/if}
  <div class="flex justify-between">
    <label class="text-base font-semibold text-dark" for={`upload-${fileKey}`}>
      {label}
    </label>
    {#if required}
      <span class="text-sm text-[#ff0000]">* required</span>
    {/if}
  </div>
  <p class="text-base text-[#707070] mt-2.25">{descriptions}</p>
  {#if headerLink}
    <button
      type="button"
      class="block text-base font-medium text-primary mt-6.25 cursor-pointer"
      onclick={headerLink.onClick}>{headerLink.text}<span class="ml-1.25">↗</span></button
    >
  {/if}

  <div
    class="border border-dashed min-h-62.5 rounded-lg border-[#1A1A2E33] p-4 bg-cream flex flex-col items-center justify-center gap-1.5 mt-6.25"
    id={`upload-${fileKey}`}
    role="button"
    tabindex="0"
    aria-label={`Upload ${label}`}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    onkeydown={handleKeyDown}
  >
    {#if hasMedia}
      <div class="w-full flex flex-wrap gap-2 justify-center py-2">
        {#each existingFiles as file, i (`existing-${file.id}`)}
          <div class="relative">
            {#if mediaKind === 'image'}
              <img src={file.url} alt={file.name} class="h-20 w-20 rounded object-cover" />
            {:else}
              <div class="h-20 w-20 rounded bg-[#eee] flex items-center justify-center text-2xl">
                {mediaKind === 'audio' ? '🎵' : '🎬'}
              </div>
            {/if}
            <button
              type="button"
              onclick={(e) => removeExisting(e, i)}
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#ddd4cc] text-[#71707a] hover:text-red-500 flex items-center justify-center text-xs transition-colors"
              >✕</button
            >
          </div>
        {/each}
        {#each selectedFiles as file, i (file.name + i)}
          <div class="relative">
            {#if mediaKind === 'image'}
              <img src={URL.createObjectURL(file)} alt={file.name} class="h-20 w-20 rounded object-cover" />
            {:else}
              <div class="h-20 w-20 rounded bg-[#eee] flex items-center justify-center text-2xl">
                {mediaKind === 'audio' ? '🎵' : '🎬'}
              </div>
            {/if}
            <button
              type="button"
              onclick={(e) => removeFile(e, i)}
              class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#ddd4cc] text-[#71707a] hover:text-red-500 flex items-center justify-center text-xs transition-colors"
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
      <button
        type="button"
        onclick={openFilePicker}
        class="w-10.5 h-10.5 rounded-full bg-primary text-white flex items-center justify-center text-4xl">+</button
      >
      <p class="text-base font-semibold text-dark">{emptyStateText}</p>
    {/if}

    <input type="file" class="hidden" bind:this={imageInput} onchange={handleFileInput} {accept} {multiple} />
  </div>

  <span class="text-[10px] text-right text-[#747474] w-full block">{helperText}</span>
</div>
