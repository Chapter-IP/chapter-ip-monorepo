<script lang="ts">
  import { canPurchaseLicense, purchaseLicense } from '$lib/content/purchaseLicense'
  import { extractTextFromFile } from '@repo/fe-services'
  import type { WorkDetails } from '@repo/content-types/works'
  import { truncateSamplePreview } from './samplePreview'

  let { workDetails }: { workDetails: WorkDetails } = $props()
  let selectedLicenseId = $state('')
  let purchasePending = $state(false)
  let sampleText = $state('')
  let sampleExpanded = $state(false)
  let sampleLoading = $state(false)
  let sampleError = $state(false)
  const isLyrics = $derived(workDetails.contentType === 'Lyrics')
  const licenses = $derived(
    ['perpetual', 'single-use'].flatMap((id) => workDetails.licenses.filter((license) => license.id === id)),
  )
  const selectedLicense = $derived(licenses.find(({ id }) => id === selectedLicenseId))
  const purchase = $derived({ contentTokenId: workDetails.contentTokenId, name: workDetails.title })
  const purchaseDisabled = $derived(purchasePending || !canPurchaseLicense(purchase, selectedLicense))
  const displayText = $derived(sampleText || (isLyrics ? workDetails.description : ''))
  const samplePreview = $derived(sampleExpanded ? displayText : truncateSamplePreview(displayText))
  const formatPrice = (price: string) => Number(price).toLocaleString('en-US', { maximumFractionDigits: 2 })

  $effect(() => {
    if (!licenses.some(({ id }) => id === selectedLicenseId)) selectedLicenseId = licenses[0]?.id ?? ''
  })

  $effect(() => {
    const sample = workDetails.sample
    const storedSampleText = workDetails.sampleText || ''
    let cancelled = false
    sampleText = storedSampleText
    sampleExpanded = false
    sampleError = false
    sampleLoading = false

    if (storedSampleText || !sample) return

    sampleLoading = true
    ;(async () => {
      try {
        const response = await fetch(sample.url)
        if (!response.ok) throw new Error(`Sample request failed with status ${response.status}`)
        const blob = await response.blob()
        const file = new File([blob], sample.filename, { type: blob.type })
        const text = await extractTextFromFile(file)
        if (!cancelled) sampleText = text
      } catch (error) {
        console.error('Failed to load creative work sample:', error)
        if (!cancelled) sampleError = true
      } finally {
        if (!cancelled) sampleLoading = false
      }
    })()

    return () => {
      cancelled = true
    }
  })

  async function handlePurchase() {
    if (!selectedLicense || purchaseDisabled) return
    purchasePending = true
    try {
      await purchaseLicense({ purchase, license: selectedLicense })
    } finally {
      purchasePending = false
    }
  }
</script>

{#snippet checkedItems(title: string, items: string[])}
  {#if items.length}
    <section class="mt-8 border-t border-[#1a1a2e1a] pt-12 sm:pt-16" aria-label={title}>
      <h2 class="text-sm font-semibold text-dark">{title}</h2>
      <ul class="mt-6 space-y-4">
        {#each items as item (item)}
          <li class="flex items-start gap-3 text-sm font-semibold text-dark">
            <svg aria-hidden="true" class="mt-1 h-2.75 w-3.5 shrink-0 text-primary" viewBox="0 0 14 11" fill="none">
              <path d="M1 5.5 5 9.5 13 1.5" stroke="currentColor" stroke-width="2"></path>
            </svg>
            <span>{item}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
{/snippet}

<article
  class="mx-auto w-full max-w-293.75 rounded-3xl border border-[#1a1a2e26] bg-[#f8f5f1] px-5 py-10 sm:px-10 lg:px-25 lg:py-12"
>
  <div class="max-w-222.25">
    <header>
      <h1 class="font-heading text-2xl font-semibold text-dark">{workDetails.title}</h1>
      <p class="text-sm text-[#72717b]">
        {workDetails.contentType || 'Creative Work'}{workDetails.authors.length
          ? ` by ${workDetails.authors.join(', ')}`
          : ''}
      </p>
      {#if workDetails.genres.length}
        <ul class="mt-2.5 flex flex-wrap gap-1.5" aria-label="Genres">
          {#each workDetails.genres as genre (genre)}
            <li
              class="rounded-full border border-[#1a1a2e0d] bg-[#eae6e2] px-6 py-1 text-sm font-semibold text-dark/50"
            >
              {genre}
            </li>
          {/each}
        </ul>
      {/if}
    </header>

    <section class="mt-9 sm:mt-12" aria-label="Work sample" aria-busy={sampleLoading}>
      {#if !isLyrics && workDetails.description}
        <p class="mb-8 whitespace-pre-line wrap-break-word text-base leading-7 text-[#72717b]">
          {workDetails.description}
        </p>
      {/if}
      {#if sampleLoading}
        <p class="text-sm text-[#747474]">Loading sample…</p>
      {:else if samplePreview}
        <p
          id="work-sample"
          class:line-clamp-12={isLyrics && !sampleExpanded}
          class="whitespace-pre-line wrap-break-word text-base leading-7 text-[#72717b]"
        >
          {samplePreview}
        </p>
      {:else if sampleError}
        <p class="text-sm text-[#747474]">The sample preview could not be displayed.</p>
      {/if}
      {#if isLyrics && displayText}
        <button
          type="button"
          class="mt-5 text-sm font-medium text-primary hover:underline"
          aria-expanded={sampleExpanded}
          aria-controls="work-sample"
          onclick={() => (sampleExpanded = !sampleExpanded)}
        >
          {sampleExpanded ? 'Show less' : 'Show more'}
        </button>
      {:else if workDetails.sample}
        <a
          class="mt-5 inline-block text-sm font-medium text-primary hover:underline"
          href={workDetails.sample.url}
          target="_blank"
          rel="noreferrer">Read full sample ↗</a
        >
      {/if}
    </section>

    <section class="mt-12" aria-labelledby="licensing-heading">
      <h2 id="licensing-heading" class="text-sm font-semibold text-dark">Licensing Types</h2>
      {#if licenses.length}
        <div class="mt-6" role="radiogroup" aria-labelledby="licensing-heading">
          {#each licenses as license (license.id)}
            <label
              class={`relative -mt-px flex min-h-32.5 cursor-pointer gap-3 border px-4 py-4 first:mt-0 first:rounded-t-md last:rounded-b-md ${selectedLicenseId === license.id ? 'z-10 border-primary' : 'border-[#1a1a2e1a] bg-[#f5f2ed]'}`}
            >
              <input
                class="mt-0.5 h-4 w-4 shrink-0 appearance-none rounded-full border border-[#ddd] checked:border-primary/30 checked:bg-primary checked:shadow-[inset_0_0_0_3px_#f8f5f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="radio"
                name="license"
                value={license.id}
                checked={selectedLicenseId === license.id}
                onchange={() => (selectedLicenseId = license.id)}
              />
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap justify-between gap-x-4 gap-y-1 text-base font-semibold text-dark">
                  <span>{license.name}</span><span class="whitespace-nowrap">${formatPrice(license.price)}</span>
                </span>
                <span class="mt-2 block text-sm leading-5.5 text-[#747474]">{license.description}</span>
              </span>
            </label>
          {/each}
        </div>
        {#if selectedLicense}
          <p class="mt-5 text-right" aria-live="polite" aria-label="Total price">
            <span class="text-2xl font-semibold text-dark">${formatPrice(selectedLicense.price)}</span>
            <span class="text-xs font-medium text-[#747474]">USD</span>
          </p>
        {/if}
        <button
          disabled={purchaseDisabled}
          onclick={handlePurchase}
          class="mt-2 inline-flex h-13 w-full items-center justify-center rounded-sm bg-primary px-6 font-semibold text-white disabled:bg-[#dedad7]"
        >
          {purchasePending ? 'Processing...' : 'Buy License'}
        </button>
      {:else}<p class="mt-2 text-[#747474]">No licensing options are currently available.</p>{/if}
    </section>

    {@render checkedItems('Permitted Uses', workDetails.permittedUses)}
    {@render checkedItems('Additional Information', workDetails.additionalTerms)}
  </div>
</article>
