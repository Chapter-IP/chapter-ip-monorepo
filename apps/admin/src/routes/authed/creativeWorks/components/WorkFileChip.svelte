<script lang="ts">
  import FileIcon from '$lib/components/icons/FileIcon.svelte'

  let { name }: { name: string } = $props()
</script>

<div class="rounded bg-[#eae6e2] flex justify-center items-center text-[12px] text-[#71707a] py-2 px-3 gap-2">
  <FileIcon color="#71707a" class="h-4 w-4 shrink-0" />
  <span class="truncate w-full max-w-24">{name}</span>
</div>
