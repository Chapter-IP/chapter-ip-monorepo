<script lang="ts">
  import { FILTERS } from '../constants'

  let {
    activeFilter,
    onChange,
  }: {
    activeFilter: string
    onChange: (filter: string) => void
  } = $props()
</script>

<div class="flex gap-1.5">
  {#each FILTERS as f (f)}
    <button
      onclick={() => onChange(f)}
      class="md:px-5.25 px-3 py-0.75 rounded-full text-[13px] {activeFilter === f
        ? 'bg-[#6d6b76] text-[#f8f5f1] font-semibold'
        : 'bg-[#f8f5f1]/50 text-dark/30 font-medium'}"
    >
      {f}
    </button>
  {/each}
</div>
