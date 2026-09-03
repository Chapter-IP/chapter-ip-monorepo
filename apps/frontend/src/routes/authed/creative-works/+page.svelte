<script lang="ts">
  import { onMount } from 'svelte'
  import { useDefaultImage } from '$lib/content/image'
  import type { WorkItem } from './works'

  let { data } = $props()
  let carousel = $state<HTMLDivElement>()
  let canBack = $state(false)
  let canForward = $state(false)
  const hasSearch = $derived(data.filters.query.trim().length > 0)

  function updateScroll() {
    if (!carousel) return
    canBack = carousel.scrollLeft > 1
    canForward = carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 1
  }
  function scroll(direction: -1 | 1) {
    carousel?.scrollBy({ left: direction * Math.min(carousel.clientWidth * 0.8, 400), behavior: 'smooth' })
  }
  onMount(() => {
    updateScroll()
    const observer = new ResizeObserver(updateScroll)
    if (carousel) observer.observe(carousel)
    return () => observer.disconnect()
  })
</script>

<div class="mx-auto w-full max-w-360 px-6">
  <section class="mb-7" aria-labelledby="recent-works-heading">
    <div class="mb-3 flex items-center justify-between gap-4">
      <h1 id="recent-works-heading" class="text-sm font-semibold text-[#202225]">Recently added</h1>
      {#if data.recentWorkItems.length > 0}
        <div class="hidden gap-1 sm:flex">
          <button
            type="button"
            aria-label="Previous creative works"
            class="size-7 rounded-md border border-[#ddd8d1] disabled:opacity-30"
            disabled={!canBack}
            onclick={() => scroll(-1)}>‹</button
          >
          <button
            type="button"
            aria-label="Next creative works"
            class="size-7 rounded-md border border-[#ddd8d1] disabled:opacity-30"
            disabled={!canForward}
            onclick={() => scroll(1)}>›</button
          >
        </div>
      {/if}
    </div>
    {#if data.recentWorkItems.length > 0}
      <div bind:this={carousel} class="carousel-track flex snap-x gap-2 overflow-x-auto pb-1" onscroll={updateScroll}>
        {#each data.recentWorkItems as item (item.id)}
          <a
            href={`/authed/creative-works/${item.id}`}
            class="flex w-[min(88vw,382px)] shrink-0 snap-start gap-3 rounded-sm border border-[#ddd8d1] p-2.5 pb-6.5 sm:w-95.5"
          >
            <img
              src={item.imageUrl}
              alt={item.title || 'Creative work'}
              class="size-20 rounded-md object-cover"
              onerror={useDefaultImage}
            />
            <div class="min-w-0 py-1">
              <span class="rounded-full bg-[#eae6e2] px-2 py-0.5 text-[10px] font-semibold text-primary"
                >{item.contentType || 'Creative Work'}</span
              >
              <h2 class="mt-1 truncate text-sm font-semibold text-[#202225]">{item.title || 'Untitled work'}</h2>
              {#if item.authors.length}<p class="mt-1 truncate text-xs text-[#707070]">
                  by {item.authors.join(', ')}
                </p>{/if}
            </div>
          </a>
        {/each}
      </div>
    {:else}<p class="text-sm text-[#77757d]">No creative works have been added yet.</p>{/if}
  </section>

  <section
    class="rounded-2xl border border-[#ebe6df] bg-[#f8f5f1] px-4 py-8 sm:px-6 lg:px-13 lg:py-12"
    aria-labelledby="works-heading"
  >
    <h2 id="works-heading" class="text-lg font-semibold text-dark">Creative Works</h2>
    <div class="my-6 border-t border-[#e5e0d9]"></div>
    {#if data.workItems.length > 0}
      <div class="grid grid-cols-1 gap-x-6 gap-y-12 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {#each data.workItems as item (item.id)}
          <a href={`/authed/creative-works/${item.id}`} class="group min-w-0">
            <div class="relative overflow-hidden rounded-lg bg-[#eee8ff]">
              <img
                src={item.imageUrl}
                alt={item.title || 'Creative work'}
                class="aspect-square w-full object-cover group-hover:opacity-85"
                onerror={useDefaultImage}
              />
              <span
                class="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-primary"
                >{item.contentType || 'Creative Work'}</span
              >
            </div>
            <h3 class="mt-3 truncate text-base font-semibold text-[#202225]">{item.title || 'Untitled work'}</h3>
            {#if item.authors.length}<p class="mt-0.5 truncate text-xs text-[#747474]">
                by {item.authors.join(', ')}
              </p>{/if}
            {#if item.description}<p class="mt-1 line-clamp-2 text-sm leading-4.5 text-[#747474]">
                {item.description}
              </p>{/if}
          </a>
        {/each}
      </div>
    {:else}
      <div class="py-16 text-center text-[#747474]">
        {hasSearch ? 'No creative works match your search.' : 'No creative works available.'}
      </div>
    {/if}
  </section>
</div>

<style>
  .carousel-track {
    scrollbar-width: none;
  }
  .carousel-track::-webkit-scrollbar {
    display: none;
  }
</style>
