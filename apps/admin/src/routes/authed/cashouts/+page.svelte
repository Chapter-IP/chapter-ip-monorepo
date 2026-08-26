<script lang="ts">
  import RowActionMenu from '$lib/components/RowActionMenu.svelte'
  import TablePagination from '$lib/components/TablePagination.svelte'
  import { formatDate } from '../files/helper'
  import { TABLE_PAGE_SIZE } from '$lib/constants'
  import { notify, ToastType } from '@repo/ui-components'
  import { MOCK_CASHOUT_REQUESTS, CashoutMenuItems, type TCashoutRequest } from './constants'

  let items = $state<TCashoutRequest[]>(MOCK_CASHOUT_REQUESTS)
  let activeFilter = $state('All')
  let activeMenuRow = $state<string | null>(null)
  let currentPage = $state(1)

  const pageSize = TABLE_PAGE_SIZE

  const statusCounts = $derived({
    all: items.length,
    accepted: items.filter((r) => r.status === 'approved' || r.status === 'paid').length,
    rejected: items.filter((r) => r.status === 'rejected').length,
    pending: items.filter((r) => r.status === 'pending').length,
  })

  const filters = [
    { label: 'All', value: 'All', count: statusCounts.all },
    { label: 'Accepted', value: 'Accepted', count: statusCounts.accepted },
    { label: 'Rejected', value: 'Rejected', count: statusCounts.rejected },
    { label: 'Pending', value: 'Pending', count: statusCounts.pending },
  ]

  const filteredItems = $derived(
    items.filter((r) => {
      if (activeFilter === 'All') return true
      if (activeFilter === 'Accepted') return r.status === 'approved' || r.status === 'paid'
      return r.status === activeFilter.toLowerCase()
    }),
  )

  const totalPages = $derived(Math.max(1, Math.ceil(filteredItems.length / pageSize)))
  const safeCurrentPage = $derived(Math.min(currentPage, totalPages))
  const paginatedItems = $derived(filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize))

  function handleAccept(id: string) {
    items = items.map((r) => (r.id === id ? { ...r, status: 'approved' as const } : r))
    notify('Payment accepted', ToastType.SUCCESS)
  }

  function handleReject(id: string) {
    items = items.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r))
    notify('Payment rejected', ToastType.FAIL)
  }

  function handleMenuSelect(_item: { text: string; href?: string; action?: string }, _id: string) {}
</script>

<div class="min-h-xl md:p-12.5 py-6 border border-[#eef2f6] rounded-3xl bg-[#f8f5f1]">
  <h2 class="md:mb-2.5 text-lg font-semibold leading-[1.61px] text-left text-dark">Admin Dashboard</h2>

  <div class="mt-14">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-[#f0ede6] gap-4 md:gap-0"
    >
      <h2 class="text-base font-semibold leading-[1.81px] text-dark">My Listings</h2>
      <div class="flex gap-1.5">
        {#each filters as f (f.value)}
          <button
            onclick={() => {
              activeFilter = f.value
              currentPage = 1
            }}
            class="md:px-5.25 px-3 py-0.75 rounded-full text-[13px] {activeFilter === f.value
              ? 'bg-[#6d6b76] text-[#f8f5f1] font-semibold'
              : 'bg-[#f8f5f1]/50 text-dark/30 font-medium'}"
          >
            {f.label}({f.count})
          </button>
        {/each}
      </div>
    </div>

    <div class="border border-[#ddd] rounded-md overflow-visible">
      <div class="overflow-x-auto">
        <table class="w-full text-sm font-medium text-dark/60">
          <thead>
            <tr class="text-left border-b border-[#ddd] bg-cream">
              <th class="px-4 py-3.5">Date</th>
              <th class="px-4 py-3.5">Name</th>
              <th class="px-4 py-3.5">Email Address</th>
              <th class="px-4 py-3.5">Payment via</th>
              <th class="px-4 py-3.5">Total</th>
              <th class="px-4 py-3.5 min-w-43">Status</th>
              <th class="px-4 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {#if paginatedItems.length}
              {#each paginatedItems as request, i (request.id)}
                <tr
                  class="border-b border-[#ddd] last:border-0 {activeMenuRow === request.id
                    ? 'bg-[#ece7df]'
                    : i % 2 === 0
                      ? 'bg-[#f8f5f1]'
                      : 'bg-cream'}"
                >
                  <td class="px-4 py-1.5">{formatDate(request.createdAt)}</td>
                  <td class="px-4 py-1.5">{request.publisherName}</td>
                  <td class="px-4 py-1.5">{request.publisherEmail}</td>
                  <td class="px-4 py-1.5">{request.paymentMethod}</td>
                  <td class="px-4 py-1.5">${(request.amount / 100).toFixed(2)}</td>
                  <td class="px-4 py-1.5">
                    {#if request.status === 'pending'}
                      <div class="flex gap-2">
                        <button
                          onclick={() => handleAccept(request.id)}
                          class="px-3 py-1 rounded text-xs font-semibold text-white bg-[#499b60] hover:bg-[#3d8a52] transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onclick={() => handleReject(request.id)}
                          class="px-3 py-1 rounded text-xs font-semibold text-white bg-[#d14e4e] hover:bg-[#b93c3c] transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    {:else if request.status === 'approved' || request.status === 'paid'}
                      <span class="text-sm font-semibold text-[#499b60]">Payment accepted</span>
                    {:else}
                      <span class="text-sm font-semibold text-[#d14e4e]">Payment rejected</span>
                    {/if}
                  </td>
                  <td class="px-4 py-1.5 text-right">
                    <RowActionMenu
                      items={CashoutMenuItems}
                      buttonLabel={`Open actions for ${request.publisherName}`}
                      onOpenChange={(open) => (activeMenuRow = open ? request.id : null)}
                      onSelect={(item) => handleMenuSelect(item, request.id)}
                    />
                  </td>
                </tr>
              {/each}
            {:else}
              <tr class="border-b border-[#ddd] last:border-0 bg-[#f8f5f1]">
                <td colspan="7" class="px-4 py-4 text-center">No cashout requests yet.</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <TablePagination
      from={paginatedItems.length ? (safeCurrentPage - 1) * pageSize + 1 : 0}
      to={Math.min(safeCurrentPage * pageSize, filteredItems.length)}
      total={filteredItems.length}
      label="requests"
      previousDisabled={safeCurrentPage === 1}
      nextDisabled={safeCurrentPage === totalPages}
      onPrevious={() => {
        currentPage = Math.max(1, safeCurrentPage - 1)
      }}
      onNext={() => {
        currentPage = Math.min(totalPages, safeCurrentPage + 1)
      }}
    />
  </div>
</div>
