<script lang="ts">
  export type ProgressFileItem = {
    id: string
    label: string
    percent: number
  }

  export type ProgressFileListProps = {
    files: ProgressFileItem[]
  }

  let { files }: ProgressFileListProps = $props()
</script>

<div class="mt-6 max-h-[280px] max-w-[500px] space-y-4 overflow-y-auto pr-1" aria-live="polite">
  {#each files as file (file.id)}
    {@const filePercent = Math.min(100, Math.max(0, Math.round(file.percent)))}
    <div>
      <div
        class="h-[15px] w-full overflow-hidden rounded-[7.5px] bg-[#747474]/15"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={filePercent}
        aria-label={file.label}
      >
        <div
          class="h-full rounded-[7.5px] bg-primary transition-[width] duration-150"
          style:width="{filePercent}%"
        ></div>
      </div>
      <p class="mt-1 truncate text-[9px] font-normal text-[#747474]">{file.label}</p>
    </div>
  {/each}
</div>
