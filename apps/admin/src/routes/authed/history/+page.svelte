<script lang="ts">
  import RowActionMenu from '$lib/components/RowActionMenu.svelte'
  import TablePagination from '$lib/components/TablePagination.svelte'
  import { formatDate } from '../files/helper'
  import { HistoryMenuItems } from './constants'
  import { getTrpcClient } from '$lib/stores/trpc-client'
  import { useCursorPagination } from '$lib/hooks/useCursorPagination.svelte'
  import { notify, ToastType } from '@repo/ui-components'
  import { snowtraceUrl } from '@repo/fe-services'
  import { LICENSE_TYPE_VALUES } from '@repo/content-types/content'
  import { TABLE_PAGE_SIZE } from '$lib/constants'
  import type { TPurchaseHistoryItem } from './constants'

  const trpcClient = getTrpcClient()

  const pagination = useCursorPagination<TPurchaseHistoryItem>({
    fetchPage: (cursor) =>
      trpcClient.contents.findPurchaseHistory.query({
        limit: String(TABLE_PAGE_SIZE),
        sort: 'createdAt',
        order: 'desc',
        ...(cursor ? { cursor } : {}),
      }),
    onError: (err) => {
      console.error('Failed to load history', err)
      notify('Failed to load history. Please try again.', ToastType.FAIL)
    },
  })

  async function handleMenuSelect(item: { text: string; href?: string; action?: string }, purchaseId: string) {
    if (item.action === 'view-content') {
      const purchase = pagination.items.find((x) => x.id === purchaseId)
      if (purchase?.txHash) {
        window.open(`${snowtraceUrl}/tx/${purchase.txHash}`, '_blank')
      }
    }
  }
</script>

<div class="min-h-screen border border-[#1a1a2e0d] rounded-3xl bg-[#f8f5f1] p-8 md:p-12.5">
  <h1 class="text-lg font-semibold mb-6.25">History</h1>
  {#if !pagination.items.length && !pagination.loading}
    <span class="text-sm font-medium text-[#1A1A2E]/60">No purchase history yet.</span>
  {:else}
    <div class="border border-[#ddd] rounded-md overflow-visible">
      <div class="overflow-x-auto">
        <table class="min-w-190 w-full table-fixed text-sm font-medium text-[#1A1A2E]/60">
          <thead>
            <tr class="text-left border-b border-[#ddd] bg-cream">
              <th class="px-4 py-2.75">Date</th>
              <th class="px-4 py-2.75">Event</th>
              <th class="px-4 py-2.75">Item</th>
              <th class="w-48 px-4 py-2.75">Tx Hash</th>
              <th class="px-4 py-2.75">Credit</th>
              <th class="px-4 py-2.75">Debit</th>
              <th class="px-4 py-2.75"></th>
            </tr>
          </thead>
          <tbody>
            {#if pagination.loading}
              <tr>
                <td colspan="7" class="px-4 py-6 text-center">
                  <span class="loading loading-spinner loading-sm"></span>
                </td>
              </tr>
            {:else}
              {#each pagination.items as tx, i (tx.id)}
                {@const profile = tx.metadata?.profile as Record<string, unknown> | undefined}
                {@const itemName = (profile?.['fullLegalName'] ?? profile?.['stageName'] ?? '') as string}
                <tr
                  class="border-b border-[#ddd] last:border-0 {i % 2 === 0
                    ? 'bg-[#f8f5f1]'
                    : 'bg-cream'} text-sm font-bold"
                >
                  <td class="px-4 py-1.5">{formatDate(tx.createdAt)}</td>
                  <td class="px-4 py-1.5"
                    >{tx.licenseType === LICENSE_TYPE_VALUES.lifetime || tx.licenseType === LICENSE_TYPE_VALUES.oneTime
                      ? 'Purchase'
                      : 'Transaction fee'}</td
                  >
                  <td class="px-4 py-1.5">
                    {#if itemName}
                      <div>{itemName}</div>
                      <div class="text-xs">
                        {tx.licenseType === LICENSE_TYPE_VALUES.oneTime ? 'One-time license' : 'Full-time license'}
                      </div>
                    {:else}
                      {tx.licenseType === LICENSE_TYPE_VALUES.oneTime ? 'One-time license' : 'Full-time license'}
                    {/if}
                  </td>
                  <td class="w-56 px-4 py-1.5 font-mono text-xs" title={tx.txHash || undefined}>
                    {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-10)}` : '—'}
                  </td>

                  <td class="px-4 py-1.5">
                    {tx.priceFiat
                      ? `$${(Number(tx.priceFiat) / 100).toFixed(2)}`
                      : tx.priceEther
                        ? `${tx.priceEther} ETH`
                        : tx.priceToken
                          ? `${tx.priceToken} tokens`
                          : '—'}
                  </td>
                  <td class="px-4 py-1.5">-</td>
                  <td class="px-4 py-1.5 text-right">
                    <RowActionMenu
                      items={HistoryMenuItems}
                      buttonLabel={`Open actions for purchase ${tx.id}`}
                      onSelect={(item) => handleMenuSelect(item, tx.id)}
                    />
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
    <TablePagination
      from={pagination.items.length ? pagination.currentPage * TABLE_PAGE_SIZE + 1 : 0}
      to={pagination.currentPage * TABLE_PAGE_SIZE + pagination.items.length}
      total={pagination.totalCount}
      label="transactions"
      previousDisabled={pagination.currentPage === 0 || pagination.loading}
      nextDisabled={!pagination.hasNext || pagination.loading}
      onPrevious={pagination.prevPage}
      onNext={pagination.nextPage}
    />
  {/if}
</div>
