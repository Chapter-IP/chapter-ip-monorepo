<script lang="ts">
  import { ProgressModal } from '@repo/ui-components'

  export type DownloadProgressPhase = 'preparing' | 'downloading' | 'zipping'

  export type DownloadProgressState = {
    phase: DownloadProgressPhase
    completedFiles: number
    totalFiles: number
    currentFileLabel: string
  }

  let { progress }: { progress: DownloadProgressState } = $props()

  const phaseLabels: Record<DownloadProgressPhase, string> = {
    preparing: 'Preparing your download…',
    downloading: 'Downloading files…',
    zipping: 'Creating ZIP archive…',
  }

  const percent = $derived.by(() => {
    if (progress.phase === 'preparing') return 0
    if (progress.phase === 'zipping') return 99
    if (progress.totalFiles === 0) return 0
    return Math.min(99, Math.round((progress.completedFiles / progress.totalFiles) * 100))
  })

  const subtitle = $derived(phaseLabels[progress.phase])
  const showFileProgress = $derived(progress.phase === 'downloading' && progress.totalFiles > 0)
  const currentFileNumber = $derived(
    Math.min(Math.max(progress.completedFiles + (progress.currentFileLabel ? 1 : 0), 1), progress.totalFiles),
  )
</script>

<ProgressModal {percent} {subtitle} descriptionKind="download">
  {#if showFileProgress}
    <p class="mt-4 text-sm font-medium text-[#72717b]" aria-live="polite">
      File {currentFileNumber} of {progress.totalFiles}
      {#if progress.currentFileLabel}
        <span class="block truncate">{progress.currentFileLabel}</span>
      {/if}
    </p>
  {/if}
</ProgressModal>
