<script lang="ts">
  import Edit from '$lib/assets/edit.svg'
  import { type StatusValue } from '../../routes/authed/likeness/constants/constants'

  const STATUS_MAP = {
    DRAFT: { label: 'Draft', classes: 'text-[#d58b00]', img: Edit },
    ACTIVE: { label: '✓ Active', classes: 'text-[#499b60]', img: undefined },
    SALE_DISABLED: { label: '✗ Disabled', classes: 'text-[#d14e4e]', img: undefined },
  }

  let { status }: { status: StatusValue } = $props()

  const cfg = $derived(STATUS_MAP[status])
</script>

<span class="inline-flex items-center gap-1 w-24 px-2.5 py-1.25 rounded-sm text-sm {cfg.classes} whitespace-nowrap">
  {#if cfg.img}
    <img src={cfg.img} alt="" class="size-2.5" />
  {/if}
  {cfg.label}
</span>
