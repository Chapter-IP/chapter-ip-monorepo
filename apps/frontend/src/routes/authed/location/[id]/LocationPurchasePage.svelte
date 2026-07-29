<script lang="ts">
  import CompatiblePlatforms from '$lib/content/CompatiblePlatforms.svelte'
  import ImageLightbox from '$lib/content/ImageLightbox.svelte'
  import { canPurchaseLicense, purchaseLicense } from '$lib/content/purchaseLicense'
  import type { LocationDetails } from './types'
  import type { LocationItem } from '../location'
  import NextPage from '$lib/assets/next.svg'
  import FileImg from '$lib/assets/file_img.svg'

  let {
    locationDetails,
    similarLocations = [],
  }: { locationDetails: LocationDetails; similarLocations?: LocationItem[] } = $props()
  let showLightbox = $state(false)
  let selectedLicenseId = $state('')
  let purchasePending = $state(false)
  const selectedLicense = $derived(locationDetails.licenses.find((license) => license.id === selectedLicenseId))
  const purchaseDisabled = $derived(purchasePending || !canPurchaseLicense(locationDetails, selectedLicense))
  const city = $derived(locationDetails.address?.city ? `by The City of ${locationDetails.address.city}` : '')
  const addressFields = (() => {
    const address = locationDetails.address
    if (!address) return []
    return [
      { label: 'Street', value: address.street },
      { label: 'Apt / Suite', value: address.apt },
      { label: 'City', value: address.city },
      { label: 'State', value: address.state },
      { label: 'ZIP code', value: address.zip },
    ].filter((field) => field.value.trim())
  })()

  $effect(() => {
    if (!selectedLicenseId && locationDetails.licenses[0]) selectedLicenseId = locationDetails.licenses[0].id
  })

  async function handlePurchase() {
    if (!selectedLicense || purchaseDisabled) return

    purchasePending = true
    try {
      await purchaseLicense({ purchase: locationDetails, license: selectedLicense })
    } finally {
      purchasePending = false
    }
  }
</script>

<article
  class="mx-auto w-full max-w-293.75 rounded-3xl border border-[#1a1a2e0d] bg-[#f8f5f1] px-5 py-10 sm:px-10 sm:py-12 lg:px-25 lg:pt-12.25 lg:pb-16"
>
  <header class="max-w-237.5">
    <h1 class="font-heading text-2xl leading-7.25 font-semibold text-dark">{locationDetails.name}</h1>
    {#if city}
      <p class="mt-1 text-xs leading-4.5 font-medium text-[#747474]">{city}</p>
    {/if}
    <p class="mt-2.75 whitespace-pre-line text-base leading-7 text-[#72717b] wrap-break-word">
      {locationDetails.description || 'No description provided.'}
    </p>
  </header>

  <div class="mt-12.5 grid gap-12 lg:grid-cols-[400px_minmax(0,515px)] lg:gap-8.75">
    <div class="min-w-0">
      {#if addressFields.length > 0}
        <section aria-labelledby="address-heading" class="mb-5">
          <h2 id="address-heading" class="font-sans text-base leading-5.25 font-semibold text-[#202225]">Address</h2>
          <dl class="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-[#1a1a2e1a] py-3.5">
            {#each addressFields as field (field.label)}
              <div class="min-w-0">
                <dt class="text-xs leading-4.5 font-medium text-[#747474]">{field.label}</dt>
                <dd class="mt-0.5 truncate text-sm leading-5.25 font-medium text-[#202225]" title={field.value}>
                  {field.value}
                </dd>
              </div>
            {/each}
          </dl>
        </section>
      {/if}
      <section aria-label="Location preview" class="relative">
        <button
          type="button"
          class="relative block aspect-400/216 w-full overflow-hidden bg-[#202225]"
          aria-label={`Enlarge ${locationDetails.image.alt}`}
          onclick={() => (showLightbox = true)}
        >
          <img src={locationDetails.image.src} alt={locationDetails.image.alt} class="size-full object-cover" />
          <span
            class="absolute top-2.75 right-2.75 flex size-3 items-center justify-center text-[#cecbc8]"
            aria-hidden="true"
          >
            <svg viewBox="0 0 12 12" class="size-3" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
            </svg>
          </span>
        </button>
      </section>

      {#if locationDetails.tags.length > 0}
        <ul class="mt-5 flex flex-wrap gap-2" aria-label="Location tags">
          {#each locationDetails.tags as tag (tag)}
            <li
              class="rounded-[14.5px] border border-[#1a1a2e1a] bg-[#f8f5f1] px-6 py-1 text-base leading-5.25 font-semibold text-[#202225]/50"
            >
              {tag}
            </li>
          {/each}
        </ul>
      {/if}

      {#if locationDetails.files.length > 0}
        <section aria-label="Location files" class="mt-5">
          <h2 class="font-sans text-base leading-5.25 font-semibold text-[#202225]">Files</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            {#each locationDetails.files as file (file)}
              <div
                class="rounded bg-[#eae6e2] flex justify-center items-center text-[12px] text-[#71707a] py-2 px-3 gap-2"
              >
                <img src={FileImg} alt="fileImg" class="h-4" />
                <span class="truncate max-w-32">{file}</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <CompatiblePlatforms
        headingId="compatible-heading"
        class="mt-8.75"
        headingClass="font-sans text-base leading-5.25 font-semibold text-[#202225]"
      />
    </div>

    <div class="min-w-0">
      <section aria-labelledby="licensing-heading">
        <h2 id="licensing-heading" class="font-sans text-base leading-5.25 font-semibold text-[#202225]">
          Licensing Types
        </h2>
        {#if locationDetails.licenses.length > 0}
          <div class="mt-6.25">
            {#each locationDetails.licenses as license (license.id)}
              <label
                class={`relative flex min-h-27.5 cursor-pointer gap-2.5 rounded-md border px-3.75 py-3.5 font-sans transition-colors ${
                  selectedLicenseId === license.id ? 'border-primary bg-cream' : 'border-[#1a1a2e1a] bg-cream'
                }`}
              >
                <input
                  type="radio"
                  name="license"
                  value={license.id}
                  checked={selectedLicenseId === license.id}
                  onchange={() => (selectedLicenseId = license.id)}
                  class="peer sr-only"
                />
                <span
                  class={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border bg-[#f8f5f1] ${
                    selectedLicenseId === license.id ? 'border-primary' : 'border-[#1a1a2e1a]'
                  }`}
                  aria-hidden="true"
                >
                  <span
                    class={`size-2.5 rounded-full bg-primary ${
                      selectedLicenseId === license.id ? 'opacity-100' : 'opacity-0'
                    }`}
                  ></span>
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-start justify-between gap-4">
                    <span class="font-semibold leading-5.25 text-[#202225]">{license.name}</span>
                    <span class="shrink-0 font-semibold leading-5.25 text-[#202225]">${license.price}</span>
                  </span>
                  {#if license.description}
                    <span class="mt-2 block text-sm leading-5.25 font-medium text-[#747474]">{license.description}</span
                    >
                  {/if}
                </span>
              </label>
            {/each}
          </div>
        {:else}
          <p class="mt-2 text-[#747474]">No licensing options are currently available.</p>
        {/if}
      </section>

      {#if selectedLicense}
        <button
          disabled={purchaseDisabled}
          onclick={handlePurchase}
          class="mt-5.5 inline-flex h-13 w-full min-w-28 items-center justify-center rounded-sm bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-[#5a28ef] disabled:cursor-not-allowed disabled:bg-[#dedad7] disabled:text-white/70"
        >
          {purchasePending ? 'Processing...' : 'Purchase'}
        </button>
      {/if}
    </div>
  </div>

  {#if similarLocations.length > 0}
    <section class="mt-25">
      <div class="flex gap-2.5 items-center">
        <h2 class="text-lg font-semibold leading-7 text-dark">Similar locations</h2>
        <img src={NextPage} alt="Next page" />
      </div>
      <div class="mt-6.25 grid grid-cols-1 gap-x-3 gap-y-5 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {#each similarLocations as item (item.id)}
          <a href={`/authed/location/${item.id}`} class="group min-w-0">
            <div class="overflow-hidden rounded-lg bg-black">
              <img
                src={item.imageUrl}
                alt={item.name}
                class="w-full aspect-324/175 object-cover transition-opacity group-hover:opacity-85"
              />
            </div>
            <h3 class="mt-2 truncate text-base font-semibold text-[#202225]">{item.name}</h3>
            {#if item.metadata?.address?.city}
              <p class="mt-1 text-xs font-medium text-[#747474]">by The City of {item.metadata.address.city}</p>
            {/if}
            {#if item.description}
              <p class="mt-2.5 text-xs leading-4.5 font-medium text-[#747474] line-clamp-2">{item.description}</p>
            {/if}
          </a>
        {/each}
      </div>
    </section>
  {/if}
</article>

{#if showLightbox}
  <ImageLightbox
    image={locationDetails.image}
    dialogLabel="Enlarged location image"
    onClose={() => (showLightbox = false)}
  />
{/if}
