<script lang="ts">
  import Code from '$lib/assets/code.svg'
  import RowActionMenu from '$lib/components/RowActionMenu.svelte'
  import TablePagination from '$lib/components/TablePagination.svelte'
  import { formatDate } from '../files/helper'
  import { NotificationsMenuItems } from './constants'
  import { getTrpcClient } from '$lib/stores/trpc-client'
  import { useCursorPagination } from '$lib/hooks/useCursorPagination.svelte'
  import { TABLE_PAGE_SIZE } from '$lib/constants'
  import { notificationStore } from '$lib/stores/notification.svelte'
  import { NOTIFICATION_TYPE } from '@repo/notifications'
  import { notify, ToastType } from '@repo/ui-components'
  import { formatContentTypeLabel } from '$lib/helpers/format'
  import type { TNotificationItem } from '@repo/notifications'

  let activeMenuRow = $state<number | null>(null)
  const trpcClient = getTrpcClient()

  const pagination = useCursorPagination<TNotificationItem>({
    fetchPage: (cursor) =>
      trpcClient.notifications.findMyNotifications.query({
        limit: String(TABLE_PAGE_SIZE),
        sort: 'createdAt',
        order: 'desc',
        ...(cursor ? { cursor } : {}),
      }),
    onError: (err) => {
      console.error('Failed to load notifications', err)
      notify('Failed to load notifications. Please try again.', ToastType.FAIL)
    },
  })

  const pageItems = $derived.by(() => {
    const merged = pagination.items.map((item) => {
      const fromStore = $notificationStore.find((s) => s.id === item.id)
      return fromStore ? { ...item, readAt: fromStore.readAt } : item
    })
    return merged.sort((a, b) => {
      if (!a.readAt && b.readAt) return -1
      if (a.readAt && !b.readAt) return 1
      return 0
    })
  })

  async function markAsRead(id: string) {
    try {
      await trpcClient.notifications.markMyNotificationAsRead.mutate({ id })
      pagination.setItems(pagination.items.map((x) => (x.id === id ? { ...x, readAt: new Date().toISOString() } : x)))
      notificationStore.update((n) => n.map((x) => (x.id === id ? { ...x, readAt: new Date().toISOString() } : x)))
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  async function handleMenuSelect(item: { text: string; href?: string; action?: string }, notificationId: string) {
    if (item.action === 'mark-read') await markAsRead(notificationId)
  }

  function getMenuItems(isRead: boolean) {
    return isRead ? NotificationsMenuItems.filter((item) => item.action !== 'mark-read') : NotificationsMenuItems
  }
</script>

{#if !pageItems.length && !pagination.loading}
  <span class="text-sm font-medium text-[#1A1A2E]/60">You have no notifications yet.</span>
{:else}
  <div class="min-h-screen border border-[#1a1a2e0d] rounded-3xl bg-[#f8f5f1] p-8 md:p-12.5">
    <h1 class="text-lg font-semibold mb-4.5">Notifications</h1>
    <div class="border border-[#ddd] rounded-md overflow-visible">
      <div class="overflow-x-auto">
        <table class="w-full text-sm font-medium text-[#1A1A2E]/60 table-fixed">
          <thead>
            <tr class="text-left border-b border-[#ddd] bg-cream">
              <th class="px-4 py-2.75 align-middle">
                <div class="flex items-center gap-2.5 cursor-pointer select-none hover:text-[#555]">
                  Date
                  <img src={Code} alt="Sort" class="size-2.5 rotate-90" />
                </div>
              </th>
              <th class="px-4 py-2.75">Message</th>
              <th class="px-4 py-2.75"></th>
            </tr>
          </thead>
          <tbody>
            {#if pagination.loading}
              <tr>
                <td colspan="3" class="px-4 py-6 text-center">
                  <span class="loading loading-spinner loading-sm"></span>
                </td>
              </tr>
            {:else}
              {#each pageItems as tx, i (tx.id)}
                {@const isRead = !!tx.readAt}
                {@const payload = tx.payload as Record<string, unknown> | undefined}
                {@const content = payload?.['content'] as Record<string, unknown> | undefined}
                {@const metadata = content?.['metadata'] as Record<string, unknown> | undefined}
                {@const itemType = metadata?.['type'] as string | undefined}
                {@const profile = metadata?.['profile'] as Record<string, unknown> | undefined}
                {@const fullLikenessName = profile?.['fullLegalName'] as string | undefined}
                {@const fullLocationsName = metadata?.['name'] as string | undefined}
                <tr
                  class="border-b border-[#ddd] last:border-0 {activeMenuRow === i
                    ? 'bg-[#ece7df]'
                    : isRead
                      ? 'bg-[#f3f0ea] text-[#1A1A2E]/40'
                      : i % 2 === 0
                        ? 'bg-[#f8f5f1]'
                        : 'bg-cream'}"
                >
                  <td class="px-4 py-1.5">{formatDate(tx.createdAt)}</td>
                  <td class="px-4 py-1.5">
                    <p class="text-[13px] font-semibold">
                      {formatContentTypeLabel(itemType)} [{fullLikenessName ?? fullLocationsName ?? ''}] {tx.type ===
                      NOTIFICATION_TYPE.CONTENT_CREATED
                        ? 'added to your products'
                        : 'was purchased'}
                    </p>
                  </td>
                  <td class="px-4 py-1.5 text-right">
                    <RowActionMenu
                      items={getMenuItems(isRead)}
                      buttonLabel={`Open actions for ${tx.message ?? tx.title}`}
                      onOpenChange={(open) => (activeMenuRow = open ? i : null)}
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
      from={pageItems.length ? pagination.currentPage * TABLE_PAGE_SIZE + 1 : 0}
      to={pagination.currentPage * TABLE_PAGE_SIZE + pageItems.length}
      total={pagination.totalCount}
      label="notifications"
      previousDisabled={pagination.currentPage === 0 || pagination.loading}
      nextDisabled={!pagination.hasNext || pagination.loading}
      onPrevious={pagination.prevPage}
      onNext={pagination.nextPage}
    />
  </div>
{/if}
