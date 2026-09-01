<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import Logo from '../assets/chapterip-full-logo-dark.svg'
  import Dots from '../assets/dots.svg'

  let {
    authStore,
    children,
    menuItems,
    logoHref = '/',
    showCreateButton = false,
    pathname = '/',
    stackOnMobile = false,
  } = $props<{
    authStore: any
    children?: () => any
    menuItems?: { text: string; href: string }[]
    logoHref?: string
    showCreateButton?: boolean
    pathname?: string
    stackOnMobile?: boolean
    notifications?: any[]
  }>()
  const { state: authState } = $derived(authStore)
  let headerRef: HTMLElement

  const NewBrowseAndPurchaseItems = [
    // {
    //   text: 'New Written Works',
    //   href: '/authed/',
    // },
    {
      text: 'New Location',
      href: '/authed/locations',
    },
    {
      text: 'New Likeness',
      href: '/authed/likeness',
    },
  ]

  function handleClickOutside(event: MouseEvent) {
    if (headerRef && !headerRef.contains(event.target as Node)) {
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<header
  bind:this={headerRef}
  style="box-shadow: 0 3px 6px rgba(26,26,46,0.05)"
  class="mx-auto w-full flex items-center justify-between md:px-10 px-4 {stackOnMobile
    ? 'lg:h-[60px]'
    : 'h-[60px]'} border-b border-[#eef2f6] bg-[#f8f5f1] sticky top-0 z-50 text-black"
>
  <div class="w-full flex items-center gap-8">
    <a href={logoHref} class="flex-shrink-0">
      <img src={Logo} alt="Logo" class="w-[110px] md:w-[130px]" />
    </a>
    {#if authState.accessToken}
      {@render children?.()}
    {/if}
  </div>

  {#if !authState.accessToken && pathname !== '/'}
    <button
      type="button"
      onclick={() => authStore.startLogin()}
      class="flex-shrink-0 text-[15px] font-medium text-[#767682] transition-colors hover:text-primary"
    >
      Sign in
    </button>
  {:else if authState.accessToken}
    <div class="dropdown dropdown-bottom flex-shrink-0 bg-transparent">
      <div
        tabindex="0"
        role="button"
        class="btn bg-transparent border-0 shadow-none hover:bg-transparent active:bg-transparent flex items-center
        gap-2 text-[15px] font-medium text-[#767682] px-0"
      >
        <img src={Dots} alt="Menu" class="w-5 h-5 flex-shrink-0" />
      </div>
      <ul
        tabindex="-1"
        class="dropdown-content menu z-50 mt-2 w-35 rounded-md border border-[#1A1A2E1A]
          bg-cream p-2 text-left text-sm font-medium text-[#1A1A2E99]
          shadow-[3px_6px_8px_0_rgba(21,34,50,0.08)] right-0 top-10 whitespace-normal break-words md:w-52"
      >
        {#each menuItems ?? [] as item}
          <li>
            <a href={item.href} class="px-4 py-2 mx-2 rounded-md transition-all hover:bg-[#E0DBD6]">
              {item.text}
            </a>
          </li>
        {/each}

        <li>
          <button
            onclick={() => authStore.logout()}
            class="text-left px-4 py-2.5 mx-2 rounded-md transition-all hover:text-red-600 text-sm font-medium text-[#1A1A2E99]"
          >
            Logout
          </button>
        </li>
      </ul>
    </div>
  {/if}
  {#if authState.accessToken && showCreateButton}
    <div class="dropdown dropdown-bottom bg-transparent flex-shrink-0">
      <div
        tabindex="0"
        role="button"
        class="btn bg-transparent border-0 shadow-none hover:bg-transparent active:bg-transparent flex items-center
      gap-2 text-[15px] font-medium text-[#767682] px-0"
      >
        <div
          class="flex items-center justify-center rounded-full bg-primary text-white
        w-7 h-7 text-sm leading-none flex-shrink-0 md:ml-[26px] ml-3"
        >
          <span class="font-normal text-3xl">+</span>
        </div>
      </div>

      <ul
        tabindex="-1"
        class="dropdown-content menu z-1 md:w-52 w-35 p-2 rounded-md
      shadow-[3px_6px_8px_0_rgba(21,34,50,0.08)]
      border border-[#1A1A2E1A]
      bg-cream text-sm font-medium text-left text-[#1A1A2E99] right-0 top-12"
      >
        {#each NewBrowseAndPurchaseItems as item (item)}
          <li><a href={item.href}>{item.text}</a></li>
        {/each}
      </ul>
    </div>
  {/if}
</header>
