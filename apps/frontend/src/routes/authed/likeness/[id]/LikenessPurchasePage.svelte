<script lang="ts">
  import ImageLightbox from '$lib/content/ImageLightbox.svelte'
  import LicenseSelection from '$lib/content/LicenseSelection.svelte'
  import { canPurchaseLicense, purchaseLicense } from '$lib/content/purchaseLicense'
  import LikenessMediaGrid from './LikenessMediaGrid.svelte'
  import LikenessProfileDetails from './LikenessProfileDetails.svelte'
  import PermittedUses from './PermittedUses.svelte'
  import type { LikenessDetails } from './types'

  let { likenessDetails }: { likenessDetails: LikenessDetails } = $props()

  let selectedImage = $state<LikenessDetails['images'][number] | null>(null)
  let selectedLicenseId = $state('')
  let purchasePending = $state(false)

  const selectedLicense = $derived(likenessDetails.licenses.find((license) => license.id === selectedLicenseId))
  const purchaseDisabled = $derived(purchasePending || !canPurchaseLicense(likenessDetails, selectedLicense))

  $effect(() => {
    if (!selectedLicenseId && likenessDetails.licenses[0]) selectedLicenseId = likenessDetails.licenses[0].id
  })

  async function handlePurchase() {
    if (!selectedLicense || purchaseDisabled) return

    purchasePending = true
    try {
      await purchaseLicense({ purchase: likenessDetails, license: selectedLicense })
    } finally {
      purchasePending = false
    }
  }
</script>

<article
  class="mx-auto w-full max-w-293.75 rounded-3xl border border-[#1a1a2e0d] bg-[#f8f5f1] px-5 py-10 sm:px-10 sm:py-12 lg:px-25 lg:pt-12.25 lg:pb-16"
>
  <header class="max-w-237.5">
    <h1 class="font-heading text-2xl leading-7.25 font-semibold text-dark">{likenessDetails.name}</h1>
    <p class="mt-2.75 whitespace-pre-line text-base leading-7 text-[#72717b] break-all">
      {likenessDetails.bio || 'No biography provided.'}
    </p>
  </header>

  <div class="mt-12.5 grid gap-12 lg:grid-cols-[400px_minmax(0,515px)] lg:gap-8.75">
    <LikenessProfileDetails {likenessDetails} onSelectImage={(image) => (selectedImage = image)} />

    <div class="min-w-0">
      <LicenseSelection
        licenses={likenessDetails.licenses}
        {selectedLicenseId}
        onSelect={(licenseId) => (selectedLicenseId = licenseId)}
        onPurchase={handlePurchase}
        {purchaseDisabled}
        {purchasePending}
      />
      <PermittedUses uses={likenessDetails.permittedUses} />
    </div>
  </div>

  <LikenessMediaGrid media={likenessDetails.media} onSelectImage={(image) => (selectedImage = image)} />
</article>

{#if selectedImage}
  <ImageLightbox image={selectedImage} dialogLabel="Enlarged likeness image" onClose={() => (selectedImage = null)} />
{/if}
