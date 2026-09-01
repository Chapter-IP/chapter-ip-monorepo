<script lang="ts">
  import type { TCashoutRequest } from '../constants'
  import { STATUS_CONFIG } from '../constants'

  let {
    request,
    onAccept,
    onReject,
  }: {
    request: TCashoutRequest
    onAccept: (id: string) => void
    onReject: (id: string) => void
  } = $props()
</script>

{#if request.status === 'pending'}
  <div class="flex gap-2">
    <button
      onclick={() => onAccept(request.id)}
      class="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium text-[#499b60] bg-[#f1fbf5] border border-[#93c4a1]/25 hover:bg-[#e5f5eb] transition-colors whitespace-nowrap"
    >
      ✓ Accept
    </button>
    <button
      onclick={() => onReject(request.id)}
      class="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium text-[#f80000] bg-[#fff4f4] border border-[#f80000]/25 hover:bg-[#ffe8e8] transition-colors whitespace-nowrap"
    >
      ✗ Reject
    </button>
  </div>
{:else}
  {@const cfg = STATUS_CONFIG[request.status]}
  <span class="inline-flex items-center gap-1 text-sm font-medium {cfg.classes} whitespace-nowrap">
    {cfg.label}
  </span>
{/if}
