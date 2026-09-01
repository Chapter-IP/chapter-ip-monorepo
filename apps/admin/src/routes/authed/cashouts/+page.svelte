<script lang="ts">
  import TablePagination from '$lib/components/TablePagination.svelte'
  import { formatDate } from '../files/helper'
  import { TABLE_PAGE_SIZE } from '$lib/constants'
  import { notify, ToastType } from '@repo/ui-components'
  import { PaymentMethodLabel, type TCashoutRequest } from './constants'
  import PaymentDecisionModal from '$lib/components/PaymentDecisionModal.svelte'
  import { modals, type ModalProps } from 'svelte-modals'
  import { updateCashoutStatusByAdmin, type UpdateCashoutStatusInput } from '$lib/services/cashout'
  import { getUserBySub } from '$lib/services/account'
  import { formatPrice } from '$lib/helpers/format'
  import { getTrpcClient } from '$lib/stores/trpc-client'
  import { useCursorPagination } from '$lib/hooks/useCursorPagination.svelte'

  type PaymentDecisionModalProps = {
    variant: 'accept' | 'decline'
    publisherName: string
    paymentMethod: string
    amount: number
    onCancel?: () => void
    onConfirm?: (reason: string) => void | Promise<void>
  }

  const trpcClient = getTrpcClient()

  type FindCashoutsStatus = Parameters<typeof trpcClient.cashouts.findCashouts.query>[0]['status']

  let activeFilter = $state('All')

  const activeStatus = $derived<FindCashoutsStatus>(
    activeFilter === 'Accepted'
      ? ('paid' as FindCashoutsStatus)
      : activeFilter === 'All'
        ? undefined
        : (activeFilter.toLowerCase() as FindCashoutsStatus),
  )

  const pagination = useCursorPagination<TCashoutRequest>({
    fetchPage: (cursor) =>
      trpcClient.cashouts.findCashouts.query({
        limit: String(TABLE_PAGE_SIZE),
        sort: 'createdAt',
        order: 'desc',
        ...(activeStatus ? { status: activeStatus } : {}),
        ...(cursor ? { cursor } : {}),
      }),
    onError: (err) => {
      console.error('Failed to load cash out requests', err)
      notify('Failed to load cash out requests', ToastType.FAIL)
    },
  })

  const filters = ['All', 'Accepted', 'Rejected', 'Pending'] as const

  async function changeFilter(value: string) {
    activeFilter = value
    await pagination.reload()
  }

  async function handleAccept(id: string) {
    const request = pagination.items.find((r) => r.id === id)
    if (!request) return
    modals.open<ModalProps & PaymentDecisionModalProps>(PaymentDecisionModal, {
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
          pagination.setItems(pagination.items.map((r) => (r.id === id ? (updated as TCashoutRequest) : r)))
          await pagination.reload()
          notify('Payment accepted', ToastType.SUCCESS)
        } catch (error) {
          const message = error instanceof Error && error.message ? error.message : 'Failed to accept payment'
          notify(message, ToastType.FAIL)
        }
      },
    })
  }

  async function handleReject(id: string) {
    const request = pagination.items.find((r) => r.id === id)
    if (!request) return
    modals.open<ModalProps & PaymentDecisionModalProps>(PaymentDecisionModal, {
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
          pagination.setItems(pagination.items.map((r) => (r.id === id ? (updated as TCashoutRequest) : r)))
          await pagination.reload()
          notify('Payment rejected', ToastType.SUCCESS)
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
        {#each filters as f (f)}
          <button
            onclick={() => changeFilter(f)}
            class="md:px-5.25 px-3 py-0.75 rounded-full text-[13px] {activeFilter === f
              ? 'bg-[#6d6b76] text-[#f8f5f1] font-semibold'
              : 'bg-[#f8f5f1]/50 text-dark/30 font-medium'}"
          >
            {f}
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
            {#if pagination.loading}
              <tr>
                <td colspan="7" class="px-4 py-6 text-center">
                  <span class="loading loading-spinner loading-sm"></span>
                </td>
              </tr>
            {:else if pagination.items.length}
              {#each pagination.items as request, i (request.id)}
                <tr class="border-b border-[#ddd] last:border-0 {i % 2 === 0 ? 'bg-[#f8f5f1]' : 'bg-cream'}">
                  <td class="px-4 py-1.5 whitespace-nowrap">{formatDate(request.createdAt)}</td>
                  {#await getUserBySub(request.sub)}
                    <td class="px-4 py-1.5">…</td>
                    <td class="px-4 py-1.5 whitespace-nowrap">…</td>
                  {:then user}
                    <td class="px-4 py-1.5">{user.name}</td>
                    <td class="px-4 py-1.5 whitespace-nowrap">{user.email}</td>
                  {:catch}
                    <td class="px-4 py-1.5">—</td>
                    <td class="px-4 py-1.5 whitespace-nowrap">—</td>
                  {/await}
                  <td class="px-4 py-1.5">{PaymentMethodLabel[request.platform]}</td>
                  <td class="px-4 py-1.5 whitespace-nowrap">{request.username}</td>
                  <td class="px-4 py-1.5">{formatPrice(request.amount)}</td>
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
      from={pagination.items.length ? pagination.currentPage * TABLE_PAGE_SIZE + 1 : 0}
      to={pagination.currentPage * TABLE_PAGE_SIZE + pagination.items.length}
      total={pagination.totalCount}
      label="requests"
      previousDisabled={pagination.currentPage === 0 || pagination.loading}
      nextDisabled={!pagination.hasNext || pagination.loading}
      onPrevious={pagination.prevPage}
      onNext={pagination.nextPage}
    />
  </div>
</div>
