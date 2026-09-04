<script lang="ts">
  import chapterLogoUrl from '@repo/ui-components/assets/chapter-new-logo.png'
  import { useDefaultImage } from '$lib/content/image'
  import { toDashboardCards, toLocationDashboardCards, toWorkDashboardCards, type DashboardSection } from './dashboard'
  import type { LikenessItem } from './likeness/likeness'
  import type { LocationItem } from './location/location'
  import type { WorkItem } from './creative-works/works'

  let {
    workItems = [],
    likenessItems,
    locationItems,
  } = $props<{
    workItems?: WorkItem[]
    likenessItems: LikenessItem[]
    locationItems: LocationItem[]
  }>()

  const sections = $derived<DashboardSection[]>([
    {
      title: 'Creative Works',
      ctaLabel: 'View all Creative Works',
      href: '/authed/creative-works',
      items: toWorkDashboardCards(workItems),
    },
    {
      title: 'Likeness',
      ctaLabel: 'View all Likenesses',
      href: '/authed/likeness',
      items: toDashboardCards(likenessItems),
    },
    {
      title: 'Locations',
      ctaLabel: 'View all Locations',
      href: '/authed/location',
      items: toLocationDashboardCards(locationItems),
    },
  ])
</script>

<div class="mx-auto w-full max-w-360">
  <header class="mb-11">
    <div class="flex justify-center">
      <img src={chapterLogoUrl} alt="ChapterIP" class="w-75 object-contain" />
    </div>
    <p class="text-center text-base text-[#707070]">Infrastructure for media IP licensing in the AI age.</p>
  </header>

  <div
    class="space-y-12 lg:space-y-14 rounded-3xl border border-solid border-dark/15 bg-[#f8f5f1] py-10 px-12.5 mb-30.75"
  >
    {#each sections as section (section.title)}
      <section
        class:opacity-55={section.disabled}
        class="transition-opacity"
        aria-labelledby={`${section.title.toLowerCase().replaceAll(' ', '-')}-heading`}
      >
        <div class="mb-4 flex items-center justify-between gap-4">
          <h2
            id={`${section.title.toLowerCase().replaceAll(' ', '-')}-heading`}
            class="text-base font-semibold leading-[1.81px] text-left text-dark"
          >
            {section.title}
          </h2>

          {#if section.href && !section.disabled}
            <a class="text-sm hover:text-[#5028cc] text-primary" href={section.href}>
              {section.ctaLabel}
            </a>
          {:else}
            <span class="cursor-not-allowed text-sm font-bold text-[#a6a1aa]" aria-disabled="true">
              {section.ctaLabel}
            </span>
          {/if}
        </div>

        {#if section.items.length > 0}
          <div class="grid grid-cols-1 gap-x-7 gap-y-8 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {#each section.items as item (item.id)}
              <article class="min-w-0">
                {#if section.href && !section.disabled}
                  <a href={`${section.href}/${item.id}`} class="group block">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      class="aspect-square w-full rounded-lg object-cover transition-opacity group-hover:opacity-85"
                      onerror={useDefaultImage}
                    />
                    <h3 class="mt-3 line-clamp-2 text-base font-semibold text-left text-[#202225]">{item.title}</h3>
                    <p class="mt-1 line-clamp-4 text-sm font-medium leading-4.5 text-[#747474]">
                      {item.description}
                    </p>
                  </a>
                {:else}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    class:grayscale={section.disabled}
                    class="aspect-square w-full rounded-lg object-cover"
                  />
                  <h3 class="mt-3 line-clamp-2 text-base font-bold leading-4.75 text-dark">{item.title}</h3>
                  <p class="mt-1 line-clamp-4 text-sm font-medium leading-4.5 text-[#77757d]">
                    {item.description}
                  </p>
                {/if}
              </article>
            {/each}
          </div>
        {:else}
          <div class="rounded-lg border border-[#e5e0d9] bg-[#f8f5f1] px-4 py-12 text-center">
            <p class="text-sm font-medium text-[#77757d]">No {section.title.toLowerCase()} available yet.</p>
          </div>
        {/if}
      </section>
    {/each}
  </div>
</div>
