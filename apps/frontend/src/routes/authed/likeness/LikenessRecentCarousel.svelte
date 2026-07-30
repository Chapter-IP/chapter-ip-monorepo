<script lang="ts">
  import { onMount } from 'svelte'
  import { useDefaultImage } from '$lib/content/image'
  import type { LikenessItem } from './likeness'
  import forwardBackwardArrow from '$lib/assets/back.svg'

  let { items } = $props<{
    items: LikenessItem[]
  }>()

  let carousel = $state<HTMLDivElement>()
  let canScrollBack = $state(false)
  let canScrollForward = $state(false)

  function updateCarouselState() {
    if (!carousel) return
    canScrollBack = carousel.scrollLeft > 1
    canScrollForward = carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 1
  }

  function scrollCarousel(direction: -1 | 1) {
    carousel?.scrollBy({ left: direction * Math.min(carousel.clientWidth * 0.8, 400), behavior: 'smooth' })
  }

  onMount(() => {
    updateCarouselState()
    const resizeObserver = new ResizeObserver(updateCarouselState)
    if (carousel) resizeObserver.observe(carousel)

    return () => resizeObserver.disconnect()
  })
</script>

<section class="mb-7" aria-labelledby="recently-added-heading">
  <div class="mb-3 flex items-center justify-between gap-4">
    <h1 id="recently-added-heading" class="text-sm font-semibold text-[#202225]">Recently added</h1>

    {#if items.length > 0}
      <div class="hidden items-center gap-1 sm:flex">
        <button
          type="button"
          aria-label="Previous likenesses"
          class="flex size-7 items-center justify-center rounded-[5px] text-lg disabled:opacity-30 border border-[#1A1A2E1A] bg-cream"
          disabled={!canScrollBack}
          onclick={() => scrollCarousel(-1)}
        >
          <img src={forwardBackwardArrow} alt="Previous" />
        </button>
        <button
          type="button"
          aria-label="Next likenesses"
          class="flex size-7 items-center justify-center rounded-[5px] text-lg disabled:opacity-30 border border-[#1A1A2E1A] bg-cream"
          disabled={!canScrollForward}
          onclick={() => scrollCarousel(1)}
        >
          <img src={forwardBackwardArrow} alt="Next" class="rotate-180" />
        </button>
      </div>
    {/if}
  </div>

  {#if items.length > 0}
    <div
      bind:this={carousel}
      class="carousel-track flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1"
      onscroll={updateCarouselState}
    >
      {#each items as item (item.id)}
        <a
          href={`/authed/likeness/${item.id}`}
          class="flex w-[min(88vw,382px)] shrink-0 snap-start gap-3 rounded-sm border border-[#ddd8d1] p-2.5 sm:w-95.5 pb-6.5"
        >
          <img
            src={item.imageUrl}
            alt={item.name || 'Likeness'}
            class="size-20 shrink-0 rounded-md object-cover"
            onerror={useDefaultImage}
          />
          <div class="min-w-0 py-1">
            <h2 class="truncate text-sm font-semibold text-left text-[#202225]">{item.name || 'Unnamed likeness'}</h2>
            {#if item.bio}
              <p class="mt-1 line-clamp-2 whitespace-pre-line break-all text-xs font-medium text-[#707070]">
                {item.bio}
              </p>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <p class="text-sm text-[#77757d]">No likenesses have been added yet.</p>
  {/if}
</section>

<style>
  .carousel-track {
    scrollbar-width: none;
  }

  .carousel-track::-webkit-scrollbar {
    display: none;
  }
</style>
