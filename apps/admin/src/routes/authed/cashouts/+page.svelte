<script lang="ts">
  import TablePagination from '$lib/components/TablePagination.svelte'
  import { formatDate } from '../files/helper'
  import { TABLE_PAGE_SIZE } from '$lib/constants'
  import { notify, ToastType } from '@repo/ui-components'
  import { PaymentMethodLabel, type TCashoutRequest } from './constants'
  import PaymentConfirmModal from '$lib/components/PaymentConfirmModal.svelte'
  import { modals, type ModalProps } from 'svelte-modals'
  import { updateCashoutStatusByAdmin, type UpdateCashoutStatusInput } from '$lib/services/cashout'
  import { getUserBySub } from '$lib/services/account'

  type PaymentConfirmModalProps = {
    variant: 'accept' | 'decline'
    publisherName: string
    paymentMethod: string
    amount: number
    onCancel?: () => void
    onConfirm?: (reason: string) => void | Promise<void>
  }

  let { data } = $props()

  let items = $state<TCashoutRequest[]>(data.cashouts)
  let activeFilter = $state('All')
  let currentPage = $state(1)

  const pageSize = TABLE_PAGE_SIZE

  const statusCounts = $derived({
    all: items.length,
    accepted: items.filter((r) => r.status === 'paid').length,
    rejected: items.filter((r) => r.status === 'rejected').length,
    pending: items.filter((r) => r.status === 'pending').length,
  })

  const filters = $derived([
    { label: 'All', value: 'All', count: statusCounts.all },
    { label: 'Accepted', value: 'Accepted', count: statusCounts.accepted },
    { label: 'Rejected', value: 'Rejected', count: statusCounts.rejected },
    { label: 'Pending', value: 'Pending', count: statusCounts.pending },
  ])

  const filteredItems = $derived(
    items.filter((r) => {
      if (activeFilter === 'All') return true
      if (activeFilter === 'Accepted') return r.status === 'paid'
      return r.status === activeFilter.toLowerCase()
    }),
  )

  const totalPages = $derived(Math.max(1, Math.ceil(filteredItems.length / pageSize)))
  const safeCurrentPage = $derived(Math.min(currentPage, totalPages))
  const paginatedItems = $derived(filteredItems.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize))

  function handleAccept(id: string) {
    const request = items.find((r) => r.id === id)
    if (!request) return
    modals.open<ModalProps & PaymentConfirmModalProps>(PaymentConfirmModal, {
      variant: 'accept',
      publisherName: request.username,
      paymentMethod: PaymentMethodLabel[request.platform],
      amount: request.amount,
      onConfirm: async (reason: string) => {
        try {
          const updated = await updateCashoutStatusByAdmin({
            id,
            status: 'paid' as UpdateCashoutStatusInput['status'],
            reason,
          })
          items = items.map((r) => (r.id === id ? (updated as TCashoutRequest) : r))
          notify('Payment accepted', ToastType.SUCCESS)
        } catch (error) {
          const message = error instanceof Error && error.message ? error.message : 'Failed to accept payment'
          notify(message, ToastType.FAIL)
        }
      },
    })
  }

  function handleReject(id: string) {
    const request = items.find((r) => r.id === id)
    if (!request) return
    modals.open<ModalProps & PaymentConfirmModalProps>(PaymentConfirmModal, {
      variant: 'decline',
      publisherName: request.username,
      paymentMethod: PaymentMethodLabel[request.platform],
      amount: request.amount,
      onConfirm: async (reason: string) => {
        try {
          const updated = await updateCashoutStatusByAdmin({
            id,
            status: 'rejected' as UpdateCashoutStatusInput['status'],
            reason,
          })
          items = items.map((r) => (r.id === id ? (updated as TCashoutRequest) : r))
          notify('Payment rejected', ToastType.FAIL)
        } catch (error) {
          const message = error instanceof Error && error.message ? error.message : 'Failed to reject payment'
          notify(message, ToastType.FAIL)
        }
      },
    })
  }
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
            {f.label} ({f.count})
          </button>
        {/each}
      </div>
    </div>

    <div class="border border-[#ddd] rounded-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm font-medium text-dark/60">
          <thead>
            <tr class="text-left border-b border-dark/10 bg-cream">
              <th class="px-4 py-3.5">Date</th>
              <th class="px-4 py-3.5">Name</th>
              <th class="px-4 py-3.5">Email Address</th>
              <th class="px-4 py-3.5">Payment via</th>
              <th class="px-4 py-3.5">User name</th>
              <th class="px-4 py-3.5">Total</th>
              <th class="px-4 py-3.5 min-w-43">Status</th>
            </tr>
          </thead>
          <tbody>
            {#if paginatedItems.length}
              {#each paginatedItems as request, i (request.id)}
                <tr class="border-b border-[#ddd] last:border-0 {i % 2 === 0 ? 'bg-[#f8f5f1]' : 'bg-cream'}">
                  <td class="px-4 py-1.5 whitespace-nowrap">{formatDate(request.createdAt)}</td>
                  <td class="px-4 py-1.5">{#await getUserBySub(request.sub)}…{:then user}{user.name}{/await}</td>
                  <td class="px-4 py-1.5 whitespace-nowrap"
                    >{#await getUserBySub(request.sub)}…{:then user}{user.email}{/await}</td
                  >
                  <td class="px-4 py-1.5">{PaymentMethodLabel[request.platform]}</td>
                  <td class="px-4 py-1.5 whitespace-nowrap">{request.username}</td>
                  <td class="px-4 py-1.5">${(request.amount / 100).toFixed(2)}</td>
                  <td class="px-4 py-1.5">
                    {#if request.status === 'pending'}
                      <div class="flex gap-2">
                        <button
                          onclick={() => handleAccept(request.id)}
                          class="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium text-[#499b60] bg-[#f1fbf5] border border-[#93c4a1]/25 hover:bg-[#e5f5eb] transition-colors whitespace-nowrap"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onclick={() => handleReject(request.id)}
                          class="inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium text-[#f80000] bg-[#fff4f4] border border-[#f80000]/25 hover:bg-[#ffe8e8] transition-colors whitespace-nowrap"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    {:else}
                      {@const STATUS = {
                        paid: { label: '✓ Payment accepted', classes: 'text-[#499b60]' },
                        rejected: { label: '✗ Payment rejected', classes: 'text-[#f80000]' },
                        cancelled: { label: 'Cancelled', classes: 'text-dark/40' },
                      }}
                      {@const cfg = STATUS[request.status]}
                      <span class="inline-flex items-center gap-1 text-sm font-medium {cfg.classes} whitespace-nowrap">
                        {cfg.label}
                      </span>
                    {/if}
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
