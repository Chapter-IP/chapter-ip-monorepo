<script lang="ts">
  import { ProgressFileList, ProgressModal } from '@repo/ui-components'

  export type DownloadProgressPhase = 'preparing' | 'downloading' | 'zipping'

  export type DownloadFileProgress = {
    label: string
    percent: number
  }

  export type DownloadProgressState = {
    phase: DownloadProgressPhase
    completedFiles: number
    totalFiles: number
    files: DownloadFileProgress[]
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
  const showFileProgress = $derived(
    progress.phase === 'downloading' && progress.totalFiles > 0 && progress.files.length > 0,
  )

  const fileItems = $derived(
    progress.files.map((file, index) => ({
      id: `${index}-${file.label}`,
      label: file.label,
      percent: file.percent,
    })),
  )
</script>

<ProgressModal {percent} {subtitle} descriptionKind="download">
  {#if showFileProgress}
    <ProgressFileList files={fileItems} />
  {/if}
</ProgressModal>
