<script lang="ts">
  import { goto } from '$app/navigation'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import { currentUrlWithSearchParams } from '$lib/navigation/searchParams'

  type SearchTarget = {
    label: string
    href?: string
    disabled?: boolean
  }

  const defaultSearchTargets: SearchTarget[] = [
    { label: 'Creative Works', href: '/authed/creative-works' },
    { label: 'Likeness', href: '/authed/likeness' },
    { label: 'Location', href: '/authed/location' },
    { label: 'Publishers', href: '/authed/publishers' },
  ]

  let { query = '', targets = defaultSearchTargets } = $props<{
    query?: string
    targets?: SearchTarget[]
  }>()

  let inputValue = $derived(query)
  let isOpen = $state(false)
  let root: HTMLDivElement

  const searchTargets: SearchTarget[] = $derived(targets)
  const defaultTarget = $derived(searchTargets.find((target) => target.href && !target.disabled) ?? null)
  const trimmedQuery = $derived(inputValue.trim())
  const hasQuery = $derived(trimmedQuery.length > 0)

  function openSuggestions() {
    isOpen = hasQuery
  }

  function closeSuggestions() {
    isOpen = false
  }

  function clearQueryFromUrl() {
    const searchParams = new SvelteURLSearchParams(window.location.search)
    if (!searchParams.has('q')) return

    searchParams.delete('q')
    void goto(currentUrlWithSearchParams(searchParams), { replaceState: true })
  }

  function handleInput(event: Event) {
    inputValue = event.currentTarget instanceof HTMLInputElement ? event.currentTarget.value : ''
    isOpen = hasQuery
    if (!inputValue.trim()) clearQueryFromUrl()
  }

  function handleFocusOut(event: FocusEvent) {
    if (!root.contains(event.relatedTarget as Node | null)) {
      closeSuggestions()
    }
  }

  function getTargetUrl(target: SearchTarget): string | null {
    if (!target.href) return null

    return trimmedQuery ? `${target.href}?q=${encodeURIComponent(trimmedQuery)}` : target.href
  }

  function searchTarget(target: SearchTarget) {
    const targetUrl = getTargetUrl(target)
    if (!targetUrl || !hasQuery) return

    closeSuggestions()
    void goto(targetUrl)
  }

  function searchDefaultTarget() {
    if (defaultTarget) searchTarget(defaultTarget)
  }
</script>

<div bind:this={root} class="relative w-full max-w-90 min-w-55 pb-2 lg:pb-0" onfocusout={handleFocusOut}>
  <form
    role="search"
    aria-label="Site search"
    class="flex h-9.25 items-center gap-3 rounded-sm border border-[#e4e0db] bg-white px-4 text-dark shadow-[0_1px_4px_rgba(26,26,46,0.08)]"
    onsubmit={(event) => {
      event.preventDefault()
      searchDefaultTarget()
    }}
  >
    <input
      type="search"
      value={inputValue}
      placeholder="Search for"
      class="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-[#d3d0d3]"
      autocomplete="off"
      onfocus={openSuggestions}
      oninput={handleInput}
      onkeydown={(event) => {
        if (event.key === 'Escape') closeSuggestions()
      }}
    />
    <button
      type="submit"
      class="flex size-8 shrink-0 items-center justify-center text-[#d3d0d3] transition-colors hover:text-[#77757d]"
      aria-label="Search"
    >
      <svg aria-hidden="true" class="size-7" viewBox="0 0 20 20" fill="none">
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.5" />
        <path d="M12.5 12.5L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </form>

  {#if isOpen && hasQuery}
    <div
      id="header-search-suggestions"
      class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-[#ddd8d1] bg-[#f8f5f1] shadow-[0_18px_36px_rgba(42,36,30,0.14)]"
    >
      {#each searchTargets as target (target.label)}
        <button
          type="button"
          disabled={target.disabled}
          class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-dark transition-colors enabled:hover:bg-[#eee8ff] disabled:cursor-not-allowed disabled:opacity-45"
          onpointerdown={(event) => event.preventDefault()}
          onclick={() => searchTarget(target)}
        >
          <svg aria-hidden="true" class="size-4 shrink-0 text-[#77757d]" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.8" />
            <path d="M12.5 12.5L17 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <span class="min-w-0 truncate">
            <span class="font-bold">{trimmedQuery}</span>
            <span class="font-medium text-[#77757d]"> in {target.label}</span>
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>
