<script lang="ts">
  import FileIcon from './icons/FileIcon.svelte'

  let { name, onRemove }: { name: string; onRemove: (e: MouseEvent) => void } = $props()
</script>

<div class="relative">
  <div
    class="h-20 w-20 rounded bg-[#eae6e2] flex flex-col items-center justify-center text-[10px] text-[#71707a] leading-tight text-center py-1 px-2"
  >
    <FileIcon class="mb-1 shrink-0" color="#71707a" />
    <span class="truncate w-full">{name}</span>
  </div>
  <button
    type="button"
    onclick={onRemove}
    class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-[#ddd] text-[#71707a] hover:text-red-500 flex items-center justify-center text-xs transition-colors"
    >✕</button
  >
</div>
