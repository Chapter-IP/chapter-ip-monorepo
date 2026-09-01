<script lang="ts">
  type MenuItem = {
    text: string
    href?: string
    action?: string
  }

  let {
    items,
    buttonLabel = 'Open row actions',
    onOpenChange = (_open: boolean) => {},
    onSelect = (_item: MenuItem) => {},
  }: {
    items: MenuItem[]
    buttonLabel?: string
    onOpenChange?: (open: boolean) => void
    onSelect?: (item: MenuItem) => void
  } = $props()

  let open = $state(false)
  let top = $state(0)
  let left = $state(0)
  let trigger: HTMLElement | null = null

  const menuWidth = 160
  const menuGap = 8
  const viewportPadding = 12

  function updatePosition() {
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()

    left = Math.max(viewportPadding, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding))
    top = rect.bottom + menuGap
  }

  function toggle(event: MouseEvent) {
    trigger = event.currentTarget as HTMLElement | null
    if (!trigger) return

    if (open) {
      open = false
      onOpenChange(false)
      return
    }

    updatePosition()
    open = true
    onOpenChange(true)
  }

  function closeMenu() {
    open = false
    onOpenChange(false)
  }

  function handleItemClick(item: MenuItem, event: MouseEvent) {
    if (!item.href) {
      event.preventDefault()
    }

    onSelect(item)
    closeMenu()
  }
</script>

<svelte:window onscroll={() => open && updatePosition()} onresize={() => open && updatePosition()} />

<button
  type="button"
  aria-haspopup="menu"
  aria-expanded={open}
  aria-label={buttonLabel}
  onclick={toggle}
  class="btn ml-auto flex items-center gap-2 border-0 bg-transparent px-0 text-[15px] font-medium text-[#767682] shadow-none hover:bg-transparent active:bg-transparent"
>
  <span class="cursor-pointer p-2 text-lg leading-none tracking-widest text-[#73727c] hover:text-[#555]">···</span>
</button>

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-40 cursor-default bg-transparent"
    aria-label="Close menu"
    onclick={closeMenu}
  ></button>

  <ul
    class="menu fixed z-50 w-40 rounded-md border border-dark/10 bg-cream p-2 text-left text-sm font-medium text-[#1A1A2E99] shadow-[3px_6px_8px_0_rgba(21,34,50,0.08)]"
    style={`top: ${top}px; left: ${left}px;`}
  >
    {#each items as item, menuIndex (`${item.href || item.action || 'item'}-${item.text}-${menuIndex}`)}
      <li>
        <a href={item.href} onclick={(event) => handleItemClick(item, event)}>{item.text}</a>
      </li>
    {/each}
  </ul>
{/if}
