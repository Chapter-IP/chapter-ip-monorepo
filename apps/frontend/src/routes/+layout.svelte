<script lang="ts">
  import '../app.css'
  import { Toast, Header, Footer } from '@repo/ui-components'
  import { authStore } from '$lib'
  import HeaderSearch from '$lib/components/HeaderSearch.svelte'
  import { Modals } from 'svelte-modals'
  import { page } from '$app/state'

  let { children } = $props()

  type NavItem = {
    label: string
    href?: string
    disabled?: boolean
    searchable?: boolean
  }

  const navItems: NavItem[] = [
    { label: 'Creative Works', disabled: true },
    { label: 'Likeness', href: '/authed/likeness' },
    { label: 'Location', href: '/authed/location' },
    { label: 'Publishers', href: '/authed/publishers' },
  ]

  const menuItems = [
    {
      text: 'Purchases',
      href: '/authed/purchases',
    },
  ]

  const searchTargets = navItems
    .filter((item) => item.searchable !== false)
    .map(({ label, href, disabled }) => ({ label, href, disabled })) satisfies NavItem[]

  const isHome = $derived(page.url.pathname === '/')
  const logoHref = $derived(authStore.state.accessToken ? '/authed' : '/')
</script>

<svelte:head>
  <title>ChapterIP Marketplace</title>
</svelte:head>
<Toast />
<div class="min-h-screen overflow-clip flex flex-col">
  <Header {authStore} {logoHref} pathname={page.url.pathname} {menuItems} stackOnMobile>
    <div class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-2">
      <nav aria-label="Content dashboards" class="shrink-0">
        <ul class="flex flex-wrap items-start gap-x-2 text-[15px] font-medium leading-7.25 text-[#767682] pt-2 lg:pt-0">
          {#each navItems as item, index (item.label)}
            <li class="flex items-center gap-x-2">
              {#if item.href && !item.disabled}
                <a
                  href={item.href}
                  class:text-primary={page.url.pathname === item.href || page.url.pathname.startsWith(`${item.href}/`)}
                  class="transition-colors hover:text-primary"
                >
                  {item.label}
                </a>
              {:else}
                <span class="cursor-not-allowed opacity-55" aria-disabled="true">{item.label}</span>
              {/if}

              {#if index < navItems.length - 1}
                <span class="w-px h-4 shrink-0 bg-[#767682]" aria-hidden="true"></span>
              {/if}
            </li>
          {/each}
        </ul>
      </nav>

      <div class="w-full lg:ml-auto lg:max-w-90">
        <HeaderSearch query={page.url.searchParams.get('q') ?? ''} targets={searchTargets} />
      </div>
    </div>
  </Header>
  <main class="space-y-0 flex-1 {isHome ? 'p-0' : 'md:p-6 md:pt-13.5 p-2'}">
    {@render children?.()}
  </main>
  <Footer />

  <Modals>
    <!-- shown when any modal is opened -->
    {#snippet backdrop({ close })}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="backdrop" onclick={() => close()} />
    {/snippet}
  </Modals>
</div>

<style>
  .backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.5);
  }
</style>
