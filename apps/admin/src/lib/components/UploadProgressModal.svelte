<script lang="ts">
  import { untrack } from 'svelte'
  import { ProgressModal } from '@repo/ui-components'
  import type { UploadProgressEvent } from '$lib/upload/upload.service'
  import {
    applyProgressEventToFileMap,
    displayOverallPercent,
    type FileProgressMap,
  } from '$lib/upload/upload-progress-ui'

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

  const overallPercentValue = $derived(displayOverallPercent(progress.overallProgress, progress.phase))
  const subtitle = $derived(phaseLabels[progress.phase])
  const showFileList = $derived(progress.phase === 'uploading')
</script>

<ProgressModal percent={overallPercentValue} {subtitle} descriptionKind="upload">
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
</ProgressModal>
