<script lang="ts">
  import mime from 'mime/lite'

  import type { DownloadableContentFile } from './types'

  let {
    files,
    title,
    onClose,
  }: {
    files: DownloadableContentFile[]
    title: string
    onClose: () => void
  } = $props()

  function closeOnBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
  role="presentation"
  onclick={closeOnBackdrop}
>
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Download files"
    tabindex="-1"
    class="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-cream p-5 shadow-2xl sm:p-8 select-none cursor-default"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs leading-4 font-semibold tracking-[0.14em] text-primary uppercase">Download Files</p>
        <h2 class="mt-1 font-heading text-2xl leading-8 font-semibold text-dark">
          {title}
        </h2>
      </div>
      <button
        type="button"
        class="btn btn-ghost min-h-10 rounded-none px-3 text-xl leading-none text-dark"
        aria-label="Close download dialog"
        onclick={onClose}
      >
        X
      </button>
    </div>

    <div class="mt-6 grid gap-3">
      {#each files as file (file.url)}
        <div
          class="flex items-center justify-between border border-[#1a1a2e1a] bg-white p-4 text-sm leading-5 text-dark select-none"
        >
          <span class="font-medium">{file.label}</span>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            download={`${file.label.replace(/[/\\]/g, '_')}.${mime.getExtension(file.mimetype) ?? 'bin'}`}
            class="text-primary no-underline hover:underline"
          >
            Download
          </a>
        </div>
      {/each}
    </div>
  </div>
</div>
