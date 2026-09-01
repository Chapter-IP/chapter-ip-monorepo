<script lang="ts">
  import LikenessFilterControls from './LikenessFilterControls.svelte'
  import LikenessGrid from './LikenessGrid.svelte'
  import LikenessRecentCarousel from './LikenessRecentCarousel.svelte'
  import { cloneFilters, emptyFilters, updateLikenessFilterUrl } from './LikenessDashboard.helpers'
  import { getActiveFilterCount, getRecentLikenesses, type LikenessFilters, type LikenessItem } from './likeness'
  import type { FilterMenu, HeightRangeValue, MultiFilterKey, WeightRangeValue } from './LikenessDashboard.types'

  let {
    items,
    recentItems: recentSourceItems = items,
    filters: initialFilters = emptyFilters(),
  } = $props<{
    items: LikenessItem[]
    recentItems?: LikenessItem[]
    filters?: LikenessFilters
  }>()

  let openFilter = $state<FilterMenu | null>(null)
  // svelte-ignore state_referenced_locally
  let filters = $state<LikenessFilters>(cloneFilters(initialFilters))

  const recentItems = $derived(getRecentLikenesses(recentSourceItems))
  const activeFilterCount = $derived(getActiveFilterCount(filters))

  $effect.pre(() => {
    filters = cloneFilters(initialFilters)
  })

  function applyFilters(nextFilters: LikenessFilters) {
    filters = nextFilters
    updateLikenessFilterUrl(filters)
  }

  function toggleFilter(menu: FilterMenu) {
    openFilter = openFilter === menu ? null : menu
  }

  function toggleMultiFilter(key: MultiFilterKey, value: string) {
    const values: string[] = filters[key]
    const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
    applyFilters({ ...filters, [key]: nextValues } as LikenessFilters)
  }

  function setHeightRange(value: HeightRangeValue) {
    applyFilters({ ...filters, height: filters.height === value ? null : value })
  }

  function setWeightRange(value: WeightRangeValue) {
    applyFilters({ ...filters, weight: filters.weight === value ? null : value })
  }

  function clearFilters() {
    openFilter = null
    applyFilters(emptyFilters())
  }
</script>

<div class="mx-auto w-full max-w-360 px-6">
  <LikenessRecentCarousel items={recentItems} />

  <section
    class="rounded-2xl border border-[#ebe6df] bg-[#f8f5f1] px-4 py-8 sm:px-6 lg:px-13 lg:py-12"
    aria-labelledby="likeness-heading"
  >
    <h2 id="likeness-heading" class="text-lg font-semibold text-dark">Likeness</h2>

    {#if items.length > 0}
      <LikenessFilterControls
        {filters}
        {activeFilterCount}
        {openFilter}
        onClearFilters={clearFilters}
        onToggleFilter={toggleFilter}
        onToggleMultiFilter={toggleMultiFilter}
        onSetHeightRange={setHeightRange}
        onSetWeightRange={setWeightRange}
      />
    {/if}

    <div class="my-6 border-t border-[#e5e0d9]"></div>

    <LikenessGrid {items} hasActiveFilters={activeFilterCount > 0} />
  </section>
</div>
