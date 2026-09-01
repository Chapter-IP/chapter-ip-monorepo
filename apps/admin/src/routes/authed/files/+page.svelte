<script lang="ts">
  import type { TMetadata } from './types.ts'
  import NewUploads from './NewUploads.svelte'
  import { formatKM } from '$lib/services/formatDate.js'
  import { formatDate } from './helper'
  import Code from '$lib/assets/code.svg'
  import RowActionMenu from '$lib/components/RowActionMenu.svelte'
  import TablePagination from '$lib/components/TablePagination.svelte'
  import StatusCell from '$lib/components/StatusCell.svelte'
  import { getMenuItems } from './constants'
  import { TABLE_PAGE_SIZE } from '$lib/constants'
  import { STATUS, type StatusValue } from '../../authed/likeness/constants/constants'
  import { getTrpcClient } from '$lib/stores/trpc-client'
  import { ConfirmModal, notify, ToastType, type TConfirmModalProps } from '@repo/ui-components'
  import { modals, type ModalProps } from 'svelte-modals'

  let { data } = $props()
  let activeFilter = $state('All')
  let activeMenuRow = $state<string | null>(null)
  let currentPage = $state(1)
  let statusById = $state<Record<string, StatusValue>>({})
  let deletedIds = $state<Record<string, true>>({})
  let updatingId = $state<string | null>(null)

  const pageSize = TABLE_PAGE_SIZE
  const filters = ['All', 'Written works', 'Locations', 'Likeness'] as const
  const trpcClient = getTrpcClient()
  const DELETE_CONFIRM_PHRASE = 'I confirm to delete my content'

  const typeOrder = {
    'Written works': 0,
    Locations: 1,
    Likeness: 2,
  }

  const normalizeFileType = (type?: string) => {
    const t = String(type ?? '')
      .trim()
      .toLowerCase()

    if (t.includes('likeness')) return 'Likeness'
    if (t.includes('location')) return 'Locations'
    if (t.includes('written')) return 'Written works'

    return 'Written works'
  }

  const getLicenseTypes = (metadata: TMetadata): string[] =>
    Object.entries(metadata?.licensing?.licenseTypes ?? {})
      .filter(([, value]) => value)
      .map(([key]) => key)

  const rows = $derived(
    data.items
      .filter((item) => !deletedIds[item.id])
      .map((item) => ({
        id: item.id,
        item,
        listingName:
          item?.metadata?.profile?.fullLegalName ||
          item?.metadata?.profile?.stageName ||
          item?.metadata?.name ||
          'Untitled',
        fileType: normalizeFileType(item?.metadata?.type),
        licenseType: getLicenseTypes(item.metadata as TMetadata),
        status: statusById[item.id] ?? item.status,
        sales: item.statistic?.boughtLicensesAmount ?? 0,
        revenue: item.statistic?.revenue ?? { fiat: '0', token: '0', eth: '0' },
      }))
      .sort(
        (a, b) =>
          (typeOrder[a.fileType as keyof typeof typeOrder] ?? 0) -
          (typeOrder[b.fileType as keyof typeof typeOrder] ?? 0),
      ),
  )

  const filteredRows = $derived(activeFilter === 'All' ? rows : rows.filter((row) => row.fileType === activeFilter))
  const totalPages = $derived(Math.max(1, Math.ceil(filteredRows.length / pageSize)))
  const safeCurrentPage = $derived(Math.min(currentPage, totalPages))
  const paginatedRows = $derived(filteredRows.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize))
  const writtenWorksCount = $derived(rows.filter((row) => row.fileType === 'Written works').length)
  const locationsCount = $derived(rows.filter((row) => row.fileType === 'Locations').length)
  const likenessCount = $derived(rows.filter((row) => row.fileType === 'Likeness').length)

  function openDeleteConfirm(rowId: string) {
    if (updatingId === rowId || deletedIds[rowId]) return

    modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
      title: 'Delete listing?',
      description: 'This cannot be undone. Customers who purchased a license will lose access to this content.',
      confirmPhrase: DELETE_CONFIRM_PHRASE,
      submitText: 'Delete',
      onSubmit: async () => {
        if (updatingId === rowId || deletedIds[rowId]) return
        updatingId = rowId
        try {
          await trpcClient.contents.removeContent.mutate({ contentId: rowId })
          deletedIds[rowId] = true
          notify('Listing deleted', ToastType.SUCCESS)
        } catch {
          notify('Failed to delete listing', ToastType.FAIL)
        } finally {
          updatingId = null
        }
      },
    })
  }

  async function handleMenuSelect(
    menuItem: { text: string; href?: string; action?: string },
    row: { id: string; item: { status?: string }; status: string },
  ) {
    if (menuItem.action === 'delete') {
      openDeleteConfirm(row.id)
      return
    }

    if (menuItem.action !== 'activate' && menuItem.action !== 'deactivate') return
    if (row.status === STATUS.DRAFT) return
    if (updatingId === row.id) return

    const newStatus = menuItem.action === 'activate' ? STATUS.ACTIVE : STATUS.SALE_DISABLED
    updatingId = row.id
    try {
      await trpcClient.contents.updateContentMetadata.mutate({ contentId: row.id, status: newStatus })
      statusById[row.id] = newStatus
      row.item.status = newStatus
      notify('Status updated', ToastType.SUCCESS)
    } catch {
      notify('Failed to update status', ToastType.FAIL)
    } finally {
      updatingId = null
    }
  }
</script>

<div class="min-h-xl md:p-8 p-y-6 border border-[#eef2f6] rounded-3xl bg-[#f8f5f1]">
  <h2 class="md:mb-2.5 font-semibold md:text-2xl text-xl leading-7.25 text-[#202025]">
    Getting started with ChapterIP
  </h2>
  <p class="mb-4 font-normal text-sm leading-6 text-[#747474]">What do you want to license today?</p>
  {#if !rows.length}
    <NewUploads />
  {:else}
    <div class="md:mt-9.75">
      <div
        class="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-[#f0ede6] gap-4 md:gap-0"
      >
        <div class="flex flex-col md:flex-row md:items-center md:gap-2.5">
          <h2 class="md:text-base text-sm font-semibold">My Listings</h2>
          <span class="text-[13px] font-medium text-dark/60">
            Written works: {writtenWorksCount} | Locations: {locationsCount} | Likeness: {likenessCount}
          </span>
        </div>
        <div class="flex md:gap-1">
          {#each filters as f (f)}
            {@const isDisabled = f === 'Written works'}
            <button
              onclick={() => {
                if (isDisabled) return
                activeFilter = f
                currentPage = 1
              }}
              disabled={isDisabled}
              class="md:px-5.25 px-3 py-1 rounded-full md:text-[13px] text-[11px] font-medium {activeFilter === f
                ? 'bg-[#6d6b76] text-[#f8f5f1]'
                : 'text-dark rounded-full'} {isDisabled ? 'opacity-30 cursor-not-allowed' : ''}"
            >
              {f}
            </button>
          {/each}
        </div>
      </div>

      <div class="border border-[#ddd] rounded-md overflow-visible">
        <div class="overflow-x-auto">
          <table class="w-full text-sm font-medium text-dark/60">
            <thead>
              <tr class="text-left border-b border-[#ddd] bg-cream">
                <th class="px-4 py-3.5 align-middle">
                  <div class="flex items-center gap-2.5 cursor-pointer hover:text-[#555]">
                    Create on
                    <img src={Code} alt="Sort" class="size-2.5 rotate-90" />
                  </div>
                </th>
                <th class="px-4 py-3.5">File name</th>
                <th class="px-4 py-3.5">File type</th>
                <th class="px-4 py-3.5">License type</th>
                <th class="px-4 py-3.5">Sales</th>
                <th class="px-4 py-3.5">Status</th>
                <th class="px-4 py-3.5">Revenue</th>
                <th class="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {#if paginatedRows.length}
                {#each paginatedRows as row, i (row.id)}
                  <tr
                    class="border-b border-[#ddd] last:border-0 {activeMenuRow === row.id
                      ? 'bg-[#ece7df]'
                      : i % 2 === 0
                        ? 'bg-[#f8f5f1]'
                        : 'bg-cream'}"
                  >
                    <td class="px-4 py-1.5">{formatDate(row.item.createdAt)}</td>
                    <td class="px-4 py-1.5">{row.listingName}</td>
                    <td class="px-4 py-1.5">{row.fileType}</td>
                    <td class="px-4 py-1.5">
                      {#if row.licenseType.length}
                        {#each row.licenseType as type, i (`${row.id}-lt-${i}`)}
                          <div>{type}</div>
                        {/each}
                      {:else}
                        N/A
                      {/if}
                    </td>
                    <td class="px-4 py-1.5">
                      {row.sales}
                    </td>
                    <td class="px-4 py-1.5">
                      <StatusCell status={row.status as StatusValue} />
                    </td>

                    <td class="px-4 py-1.5">
                      ${formatKM(Number(row.revenue.fiat) / 1e2)}
                    </td>
                    <td class="px-4 py-1.5 text-right">
                      <RowActionMenu
                        items={getMenuItems(row.id, row.item.metadata?.type, row.status as StatusValue)}
                        buttonLabel={`Open actions for ${row.listingName || 'listing'}`}
                        onOpenChange={(open) => (activeMenuRow = open ? row.id : null)}
                        onSelect={(item) => handleMenuSelect(item, row)}
                      />
                    </td>
                  </tr>
                {/each}
              {:else}
                <tr class="border-b border-[#ddd] last:border-0 bg-[#f8f5f1]">
                  <td colspan="8" class="px-4 py-4 text-center">No listings for this file type</td>
                </tr>
              {/if}
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        from={paginatedRows.length ? (safeCurrentPage - 1) * pageSize + 1 : 0}
        to={Math.min(safeCurrentPage * pageSize, filteredRows.length)}
        total={filteredRows.length}
        label="listings"
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
  {/if}
</div>
