<script lang="ts">
  import FileImg from '$lib/assets/file_img.svg'

  let { name }: { name: string } = $props()
</script>

<div class="rounded bg-[#eae6e2] flex justify-center items-center text-[12px] text-[#71707a] py-2 px-3 gap-2">
  <img src={FileImg} alt="fileImg" class="h-4" />
  <span class="truncate w-full max-w-24">{name}</span>
</div>
