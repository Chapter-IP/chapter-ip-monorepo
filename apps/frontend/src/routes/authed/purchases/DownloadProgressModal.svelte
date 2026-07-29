<script lang="ts">
  import { ProgressModal } from '@repo/ui-components'

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
</script>

<ProgressModal {percent} {subtitle} descriptionKind="download">
  {#if showFileProgress}
    <div class="mt-6 max-h-[280px] space-y-4 overflow-y-auto pr-1" aria-live="polite">
      {#each progress.files as file, index (index)}
        {@const filePercent = Math.min(100, Math.max(0, Math.round(file.percent)))}
        <div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-[#ddd4cc]">
            <div
              class="h-full rounded-full bg-primary transition-[width] duration-150"
              style:width="{filePercent}%"
            ></div>
          </div>
          <div class="mt-1 flex items-center justify-between gap-2 text-sm font-medium text-[#72717b]">
            <p class="truncate">{file.label}</p>
            <span class="shrink-0 tabular-nums">{filePercent}%</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</ProgressModal>
