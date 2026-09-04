<script lang="ts">
  import { canPurchaseLicense, purchaseLicense } from '$lib/content/purchaseLicense'
  import FileImg from '$lib/assets/file_img.svg'
  import { extractTextFromFile } from '@repo/fe-services'
  import type { WorkDetails } from '@repo/content-types/works'
  import type { WorkItem } from '../works'
  import { truncateSamplePreview } from './samplePreview'

  let { workDetails, similarWorks = [] }: { workDetails: WorkDetails; similarWorks?: WorkItem[] } = $props()
  let selectedLicenseId = $state('')
  let purchasePending = $state(false)
  let samplePreview = $state('')
  let sampleLoading = $state(false)
  let sampleError = $state(false)
  const selectedLicense = $derived(workDetails.licenses.find(({ id }) => id === selectedLicenseId))
  const purchase = $derived({ contentTokenId: workDetails.contentTokenId, name: workDetails.title })
  const purchaseDisabled = $derived(purchasePending || !canPurchaseLicense(purchase, selectedLicense))

  $effect(() => {
    if (!selectedLicenseId && workDetails.licenses[0]) selectedLicenseId = workDetails.licenses[0].id
  })

  $effect(() => {
    const sample = workDetails.sample
    let cancelled = false
    samplePreview = ''
    sampleError = false

    if (!sample) {
      sampleLoading = false
      return
    }

    sampleLoading = true
    ;(async () => {
      try {
        const response = await fetch(sample.url)
        if (!response.ok) throw new Error(`Sample request failed with status ${response.status}`)
        const blob = await response.blob()
        const file = new File([blob], sample.filename, { type: blob.type })
        const text = await extractTextFromFile(file)
        if (!cancelled) samplePreview = truncateSamplePreview(text)
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

<article
  class="mx-auto w-full max-w-293.75 rounded-3xl border border-[#1a1a2e0d] bg-[#f8f5f1] px-5 py-10 sm:px-10 lg:px-25 lg:py-12"
>
  <header>
    <span class="rounded-full bg-[#eee8ff] px-3 py-1 text-xs font-semibold text-primary"
      >{workDetails.contentType || 'Creative Work'}</span
    >
    <h1 class="mt-3 font-heading text-2xl font-semibold text-dark">{workDetails.title}</h1>
    {#if workDetails.authors.length}<p class="mt-1 text-sm text-[#747474]">by {workDetails.authors.join(', ')}</p>{/if}
    <p class="mt-3 whitespace-pre-line text-base leading-7 text-[#72717b]">
      {workDetails.description || 'No description provided.'}
    </p>
  </header>

  {#if workDetails.sample}
    <section class="mt-10" aria-labelledby="sample-heading" aria-busy={sampleLoading}>
      <h2 id="sample-heading" class="font-semibold text-dark">Sample</h2>
      {#if sampleLoading}
        <p class="mt-3 text-sm text-[#747474]">Loading sample…</p>
      {:else if samplePreview}
        <p class="mt-3 whitespace-pre-line text-base leading-7 text-[#72717b]">{samplePreview}</p>
      {:else if sampleError}
        <p class="mt-3 text-sm text-[#747474]">The sample preview could not be displayed.</p>
      {/if}
      <a
        class="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        href={workDetails.sample.url}
        target="_blank"
        rel="noreferrer">Read full sample ↗</a
      >
    </section>
  {/if}

  <div class="mt-10 grid gap-12 lg:grid-cols-[400px_minmax(0,515px)] lg:gap-9">
    <div class="min-w-0">
      <img
        src={workDetails.image.src}
        alt={workDetails.image.alt}
        class="aspect-square w-full rounded-lg bg-[#eee8ff] object-cover"
      />
      {#if workDetails.genres.length}
        <section class="mt-5" aria-label="Genres">
          <h2 class="font-semibold text-dark">Genres</h2>
          <ul class="mt-2 flex flex-wrap gap-2">
            {#each workDetails.genres as genre (genre)}<li
                class="rounded-full border border-[#1a1a2e1a] px-4 py-1 text-sm text-[#747474]"
              >
                {genre}
              </li>{/each}
          </ul>
        </section>
      {/if}
      {#if workDetails.files.length}
        <section class="mt-6" aria-label="Files">
          <h2 class="font-semibold text-dark">Files</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            {#each workDetails.files as file (file)}<div
                class="flex items-center gap-2 rounded bg-[#eae6e2] px-3 py-2 text-xs text-[#71707a]"
              >
                <img src={FileImg} alt="" class="h-4" /><span class="max-w-48 truncate">{file}</span>
              </div>{/each}
          </div>
        </section>
      {/if}
    </div>

    <section aria-labelledby="licensing-heading">
      <h2 id="licensing-heading" class="font-semibold text-dark">Licensing Types</h2>
      {#if workDetails.licenses.length}
        <div class="mt-6">
          {#each workDetails.licenses as license (license.id)}
            <label
              class={`flex min-h-27.5 cursor-pointer gap-3 rounded-md border p-4 ${selectedLicenseId === license.id ? 'border-primary' : 'border-[#1a1a2e1a]'}`}
            >
              <input
                class="mt-1"
                type="radio"
                name="license"
                value={license.id}
                checked={selectedLicenseId === license.id}
                onchange={() => (selectedLicenseId = license.id)}
              />
              <span class="flex-1"
                ><span class="flex justify-between gap-4 font-semibold text-dark"
                  ><span>{license.name}</span><span>${license.price}</span></span
                ><span class="mt-2 block text-sm text-[#747474]">{license.description}</span></span
              >
            </label>
          {/each}
        </div>
        <button
          disabled={purchaseDisabled}
          onclick={handlePurchase}
          class="mt-5 inline-flex h-13 w-full items-center justify-center rounded-sm bg-primary px-6 font-semibold text-white disabled:bg-[#dedad7]"
          >{purchasePending ? 'Processing...' : 'Purchase'}</button
        >
      {:else}<p class="mt-2 text-[#747474]">No licensing options are currently available.</p>{/if}
    </section>
  </div>

  {#if similarWorks.length}
    <section class="mt-20">
      <h2 class="text-lg font-semibold text-dark">Similar creative works</h2>
      <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {#each similarWorks as item (item.id)}<a href={`/authed/creative-works/${item.id}`}
            ><img src={item.imageUrl} alt={item.title} class="aspect-square w-full rounded-lg object-cover" /><span
              class="mt-2 block font-semibold text-dark">{item.title || 'Untitled work'}</span
            ><span class="text-xs text-[#747474]">{item.contentType}</span></a
          >{/each}
      </div>
    </section>
  {/if}
</article>
