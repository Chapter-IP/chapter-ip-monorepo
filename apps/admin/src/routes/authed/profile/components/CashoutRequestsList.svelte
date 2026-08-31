<script lang="ts">
  import TablePagination from '$lib/components/TablePagination.svelte'
  import { formatDate } from '../../files/helper'

  type CashoutRow = {
    id: string
    createdAt: string | Date
    amount: number
    platform: 'venmo' | 'cashapp'
    username: string
    status: string
    reason?: string | null
  }

  let {
    items,
    loading,
    cancellingId,
    from,
    to,
    total,
    previousDisabled,
    nextDisabled,
    onCancel,
    onPrevious,
    onNext,
  }: {
    items: CashoutRow[]
    loading: boolean
    cancellingId: string | null
    from: number
    to: number
    total: number
    previousDisabled: boolean
    nextDisabled: boolean
    onCancel: (id: string) => void
    onPrevious: () => void
    onNext: () => void
  } = $props()

  function formatCents(cents: number) {
    return `$${(cents / 100).toFixed(2)}`
  }

  function platformLabel(value: CashoutRow['platform']) {
    return value === 'venmo' ? 'Venmo' : 'CashApp'
  }

  function statusLabel(value: CashoutRow['status']) {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
</script>

<h2 class="text-[22px] font-semibold text-dark">Cash out requests</h2>

{#if !items.length && !loading}
  <span class="mt-4 block text-sm font-medium text-[#1A1A2E]/60">No cash out requests yet.</span>
{:else}
  <div class="mt-4 border border-[#ddd] rounded-md overflow-visible">
    <div class="overflow-x-auto">
      <table class="min-w-190 w-full table-fixed text-sm font-medium text-[#1A1A2E]/60">
        <thead>
          <tr class="text-left border-b border-[#ddd] bg-cream">
            <th class="px-4 py-2.75">Date</th>
            <th class="px-4 py-2.75">Amount</th>
            <th class="px-4 py-2.75">Platform</th>
            <th class="px-4 py-2.75">Username</th>
            <th class="px-4 py-2.75">Status</th>
            <th class="px-4 py-2.75">Reason</th>
            <th class="px-4 py-2.75"></th>
          </tr>
        </thead>
        <tbody>
          {#if loading}
            <tr>
              <td colspan="7" class="px-4 py-6 text-center">
                <span class="loading loading-spinner loading-sm"></span>
              </td>
            </tr>
          {:else}
            {#each items as item, i (item.id)}
              <tr
                class="border-b border-[#ddd] last:border-0 {i % 2 === 0
                  ? 'bg-[#f8f5f1]'
                  : 'bg-cream'} text-sm font-medium"
              >
                <td class="px-4 py-1.5">{formatDate(item.createdAt)}</td>
                <td class="px-4 py-1.5">{formatCents(item.amount)}</td>
                <td class="px-4 py-1.5">{platformLabel(item.platform)}</td>
                <td class="px-4 py-1.5">{item.username}</td>
                <td class="px-4 py-1.5">{statusLabel(item.status)}</td>
                <td class="px-4 py-1.5">{item.reason || '—'}</td>
                <td class="px-4 py-1.5 text-right">
                  {#if item.status === 'pending'}
                    <button
                      type="button"
                      disabled={!!cancellingId}
                      onclick={() => onCancel(item.id)}
                      class="cursor-pointer text-sm font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {#if cancellingId === item.id}
                        <span class="loading loading-spinner loading-xs"></span>
                      {:else}
                        Cancel
                      {/if}
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
  <TablePagination {from} {to} {total} label="requests" {previousDisabled} {nextDisabled} {onPrevious} {onNext} />
{/if}
