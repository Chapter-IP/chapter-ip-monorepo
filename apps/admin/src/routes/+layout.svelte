<script lang="ts">
  import '../app.css'
  import { Toast, Header, Footer } from '@repo/ui-components'
  import { authStore } from '$lib'
  import NavLink from '$lib/components/NavLink.svelte'
  import { publisherStore } from '$lib/stores/publisher.svelte'
  import { page } from '$app/state'
  import { notificationStore } from '$lib/stores/notification.svelte'

  import { getTrpcClient } from '$lib/stores/trpc-client'
  import { NOTIFICATIONS_DROPDOWN_LIMIT } from '$lib/constants'
  import { type TNotificationItem } from '@repo/notifications'
  import NotificationsDropdown from '$lib/components/NotificationsDropdown.svelte'
  import { adminStore } from '$lib/stores/admin.svelte'

  let { children } = $props()
  let avatarUrl = $derived(publisherStore.avatarUrl || '')
  const menuItems = [
    {
      text: 'Profile',
      href: '/authed/profile',
    },
    // {
    //   text: 'My Listings',
    //   href: '/authed/files',
    // },
    {
      text: 'My History',
      href: '/authed/history',
    },
    // {
    //   text: 'Billing',
    //   href: '/authed/billing',
    // },
    {
      text: 'Notifications',
      href: '/authed/notifications',
    },
  ]

  $effect(() => {
    if (!authStore.state.accessToken) return

    const trpcClient = getTrpcClient()
    const subscription = trpcClient.notifications.onMessage.subscribe(undefined, {
      onData(info) {
        const raw = info as Record<string, unknown>
        const data = { ...raw, id: raw['id'] ?? raw['_id'] } as TNotificationItem
        notificationStore.update((n) => [data, ...n])
      },
    })

    ;(async () => {
      try {
        const { items } = await trpcClient.notifications.findMyNotifications.query({
          limit: String(NOTIFICATIONS_DROPDOWN_LIMIT),
          sort: 'createdAt',
          order: 'desc',
        })

        notificationStore.set(items)
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      }
    })()

    return () => subscription.unsubscribe()
  })

  const isHome = $derived(page.url.pathname === '/')
  const logoHref = $derived(authStore.state.accessToken ? '/authed/files' : '/')
</script>

<svelte:head>
  <title>ChapterIP Content Creator</title>
</svelte:head>

<Toast />
<div class="flex min-h-screen flex-col overflow-clip bg-cream text-dark">
  <Header {authStore} {logoHref} {menuItems} pathname={page.url.pathname} showCreateButton={true}>
    <div class="flex h-full items-stretch w-full justify-between md:pl-15 pl-2">
      <div class="flex items-stretch">
        <NavLink href="/authed/files">Dashboard</NavLink>
        {#if adminStore.isClientAdmin}
          <NavLink href="/authed/cashouts">Сashouts</NavLink>
        {/if}
      </div>
      <div class="flex items-center md:gap-7.25 gap-4">
        <NotificationsDropdown />
        <a
          href="/authed/profile"
          aria-label="Open profile"
          class="my-auto flex size-7 items-center justify-center overflow-hidden rounded-full bg-primary text-white font-semibold"
        >
          {#if avatarUrl}
            <img src={avatarUrl} alt="Profile avatar" class="size-full object-cover" />
          {:else}
            {publisherStore.title?.slice(0, 1)?.toUpperCase() || 'U'}
          {/if}
        </a>
      </div>
    </div>
  </Header>
  <main class="flex flex-1 flex-col bg-cream {isHome ? '' : 'px-6 pt-9.75'}">
    <div class="flex-1">
      {@render children?.()}
    </div>
    <div class="px-6">
      <Footer />
    </div>
  </main>
</div>
