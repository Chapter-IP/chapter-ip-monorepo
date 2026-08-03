<script lang="ts">
  import { untrack } from 'svelte'
  import { ProgressFileList, ProgressModal } from '@repo/ui-components'
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
    'updating-prices': 'Updating prices on blockchain…',
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

  const fileItems = $derived(
    orderedIds.map((fileId) => ({
      id: fileId,
      label: labelById[fileId] ?? fileId,
      percent: (fileMap[fileId] ?? 0) * 100,
    })),
  )
</script>

<ProgressModal percent={overallPercentValue} {subtitle} descriptionKind="upload">
  {#if showFileList && fileItems.length > 0}
    <ProgressFileList files={fileItems} />
  {/if}
</ProgressModal>
