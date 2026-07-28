<script lang="ts">
  import { untrack } from 'svelte'
  import type { UploadProgressEvent } from '$lib/upload/upload.service'
  import { applyProgressEventToFileMap, overallPercent, type FileProgressMap } from '$lib/upload/upload-progress-ui'

  let { progress }: { progress: UploadProgressEvent } = $props()

  const phaseLabels: Record<UploadProgressEvent['phase'], string> = {
    uploading: 'Your files are currently being uploaded.',
    minting: 'Minting on blockchain…',
    finalizing: 'Finalizing content…',
    'saving-metadata': 'Saving metadata…',
  }

  let fileMap = $state<FileProgressMap>({})
  let orderedIds = $state<string[]>([])
  let labelById = $state<Record<string, string>>({})

  $effect(() => {
    const event = progress
    const next = untrack(() => applyProgressEventToFileMap(fileMap, orderedIds, labelById, event))
    fileMap = next.fileMap
    orderedIds = next.orderedIds
    labelById = next.labelById
  })

  const overallPercentValue = $derived(overallPercent(progress.overallProgress))
  const subtitle = $derived(phaseLabels[progress.phase])
  const showFileList = $derived(progress.phase === 'uploading')
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center px-3"
  role="dialog"
  aria-modal="true"
  aria-labelledby="upload-progress-heading"
  aria-describedby="upload-progress-description"
>
  <div class="fixed inset-0 bg-[rgba(37,37,55,0.85)]" aria-hidden="true"></div>

  <div
    class="relative z-10 flex w-full max-w-[900px] flex-col rounded-[12px] border border-[#1A1A2E]/20 bg-cream px-6 py-7 shadow-lg md:px-10 md:py-8"
  >
    <h2 id="upload-progress-heading" class="font-heading text-[22px] font-semibold text-dark">
      {overallPercentValue}% complete
    </h2>

    <p class="mt-2 font-sans text-base font-semibold text-dark">{subtitle}</p>

    <p id="upload-progress-description" class="mt-4 text-sm leading-relaxed text-[#72717b]">
      Please <span class="font-semibold text-dark">do not close, refresh, or navigate away</span> from this page until the
      upload is complete. Leaving this page before the process finishes may interrupt the upload and require you to start
      again. This window will update automatically once your upload has successfully completed.
    </p>

    {#if showFileList && orderedIds.length > 0}
      <div class="mt-6 max-h-[280px] space-y-4 overflow-y-auto pr-1">
        {#each orderedIds as fileId (fileId)}
          {@const filePercent = Math.min(100, Math.max(0, Math.round((fileMap[fileId] ?? 0) * 100)))}
          <div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-[#ddd4cc]">
              <div
                class="h-full rounded-full bg-primary transition-[width] duration-150"
                style:width="{filePercent}%"
              ></div>
            </div>
            <p class="mt-1 truncate text-sm font-medium text-[#72717b]">{labelById[fileId] ?? fileId}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
