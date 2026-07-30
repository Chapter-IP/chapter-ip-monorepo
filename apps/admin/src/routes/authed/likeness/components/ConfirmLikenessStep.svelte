<script lang="ts">
  import Checkmark from '$lib/assets/Checkmark.svelte'
  import Cross from '$lib/assets/Cross.svelte'
  import { likenessStore } from '../stores/likeness-store'
  import { LICENSE_TYPES, PERMITTED_USES } from '../constants/constants'
  import { ETHNICITY_OPTIONS } from '@repo/content-types/likeness'
  import { modals, type ModalProps } from 'svelte-modals'
  import { ConfirmModal, type TConfirmModalProps } from '@repo/ui-components'

  let {
    currentStep = $bindable(),
    onFormSubmit,
    onSaveDraft,
  }: {
    currentStep: number
    onFormSubmit: () => Promise<void>
    onSaveDraft?: () => Promise<void>
  } = $props()

  type PreviewItem = { src: string; name: string }

  const allPreviews = $derived.by(() => {
    const items: PreviewItem[] = []

    const addExisting = (files: typeof $likenessStore.existingFiles.headshots) => {
      for (const file of files) {
        items.push({ src: file.url, name: file.name })
      }
    }

    const addLocal = (files: File[]) => {
      for (const file of files) {
        items.push({ src: URL.createObjectURL(file), name: file.name })
      }
    }

    addLocal($likenessStore.files.headshots)
    addExisting($likenessStore.existingFiles.headshots)

    addLocal($likenessStore.files.bodyShots)
    addExisting($likenessStore.existingFiles.bodyShots)

    addLocal($likenessStore.files.voiceSamples)
    addExisting($likenessStore.existingFiles.voiceSamples)

    addLocal($likenessStore.files.videoReels)
    addExisting($likenessStore.existingFiles.videoReels)

    return items
  })

  const mainPhoto = $derived(allPreviews[0] ?? null)
  const rest = $derived(allPreviews.slice(1))

  const thumbsToShow = $derived(rest.slice(0, 3))
  const remaining = $derived(rest.length > 3 ? rest.length - 3 : 0)
  const enabledLicenseTypes = $derived(
    LICENSE_TYPES.filter((license) => $likenessStore.licensing.licenseTypes[license.id]),
  )
  const enabledPermittedUses = $derived(PERMITTED_USES.filter((use) => $likenessStore.licensing.permittedUses[use.id]))

  const ethnicityLabel = $derived(
    ETHNICITY_OPTIONS.find((o) => o.value === $likenessStore.profile.attributes.ethnicity)?.label ??
      $likenessStore.profile.attributes.ethnicity,
  )

  const lbsToKg = () => +(($likenessStore.profile.attributes.weight ?? 0) * 0.453592).toFixed(1)

  const feetInchesToCm = () =>
    +((+$likenessStore.profile.attributes.heightFt * 12 + +$likenessStore.profile.attributes.heightIn) * 2.54).toFixed(
      1,
    )

  const onSubmit = () => {
    modals.open<ModalProps & TConfirmModalProps>(ConfirmModal, {
      title: 'Confirming your Likeness',
      description:
        'By publishing, you confirm that you have the legal right to license your likeness, that the terms you’ve set are accurate, and that a Content NFT will be minted on-chain representing this listing. This action is irreversible.',
      submitText: 'I understand and will continue',
      onSubmit: async () => {
        await onFormSubmit()
      },
    })
  }
</script>

<div class="space-y-12 mt-7.25 text-dark">
  <div class="pb-6">
    <h2 class="mb-2 text-[28px] font-medium text-left text-dark">Confirm your Likeness</h2>
    <p class="mt-3 text-basetext-left text-[#72717b]">
      You're almost done. Before completing your likeness, take a moment to review the information you've provided. This
      information will be used to create your likeness, helping brands, producers, partners, and licensing opportunities
      identify and engage with you confidently.
    </p>
  </div>

  <div
    class="flex flex-col gap-20 mt-19 border border-dashed border-[#1a1a2e33] bg-cream rounded-lg py-6 px-19 justify-center"
  >
    <div class="">
      <!-- Edit button -->
      <div class="flex justify-end mb-6">
        <button
          disabled={$likenessStore.ui.loading}
          onclick={() => (currentStep = 1)}
          class="bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:bg-[#5a4bd1] transition-colors"
        >
          Edit details
        </button>
      </div>

      <!-- Avatar + name -->
      <div class="flex flex-col items-center mb-8">
        <div class="flex items-center w-111 justify-center mb-3">
          <div class="flex-1 h-px bg-[#c8c4bc]"></div>
          <div class="w-24 h-24 rounded-full overflow-hidden mx-4 shrink-0">
            {#if mainPhoto}
              <img src={mainPhoto.src} alt={mainPhoto.name} class="w-full h-full object-cover" />
            {/if}
          </div>
          <div class="flex-1 h-px bg-[#c8c4bc]"></div>
        </div>
        <h1 class="text-[28px] font-semibold text-dark tracking-tight mt-1">{$likenessStore.profile.fullLegalName}</h1>
        <span class="text-sm font-mediumtext-[#7C7C8A]">
          Stage Name: {$likenessStore.profile.stageName}
        </span>
      </div>

      <!-- Main content -->
      <div class="flex gap-6 mx-auto flex-wrap">
        <!-- Left: photo + thumbnails -->
        {#if mainPhoto}
          <div class="flex-1 max-w-100">
            <div class="rounded-xl overflow-hidden mb-2.5">
              <img src={mainPhoto.src} alt={mainPhoto.name} class="w-full object-cover" style="height: 340px;" />
            </div>

            {#if thumbsToShow.length > 0}
              <div
                class="grid gap-1.5"
                style="grid-template-columns: repeat({thumbsToShow.length + (remaining > 0 ? 1 : 0)}, 1fr)"
              >
                {#each thumbsToShow as file, i (file.name + i)}
                  <div class="rounded-lg overflow-hidden aspect-square">
                    <img src={file.src} alt={file.name} class="w-full h-full max-h-1/2 object-cover" />
                  </div>
                {/each}

                {#if remaining > 0}
                  <div class="rounded-lg overflow-hidden aspect-square relative bg-[#c4beb6]">
                    <img src={rest[3].src} alt={rest[3].name} class="w-full h-full object-cover opacity-60" />
                    <span class="absolute inset-0 flex items-center justify-center text-[#1a1a1a] font-bold text-sm">
                      +{remaining}
                    </span>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Right: info -->
        <div class="flex-[1.1] min-w-64 flex flex-col gap-6">
          <!-- Bio -->
          <div>
            <h2 class="text-base font-semibold text-[#202225] mb-1.5">Bio</h2>
            <p class="text-base text-[#72717b] leading-relaxed wrap-break-word">
              {$likenessStore.profile.bio || 'N/A'}
            </p>
          </div>

          <!-- Physical attributes -->
          <div>
            <h2 class="text-base font-semibold text-[#202225] mb-2">Physical attributes</h2>
            <table class="w-full text-base text-[#72717b]">
              <tbody>
                <tr>
                  <td class="py-1 font-semibold w-1/5">Ethnicity:</td>
                  <td class="py-1">{ethnicityLabel || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="py-1 font-semibold">Height:</td>
                  <td class="py-1">
                    {#if $likenessStore.profile.attributes.heightFt}
                      {$likenessStore.profile.attributes.heightFt}' {$likenessStore.profile.attributes.heightIn}" ({feetInchesToCm()}
                      cm)
                    {:else}
                      N/A
                    {/if}
                  </td>
                </tr>
                <tr>
                  <td class="py-1 font-semibold">Weight:</td>
                  <td class="py-1">
                    {#if $likenessStore.profile.attributes.weight}
                      {$likenessStore.profile.attributes.weight} lbs ({lbsToKg()} kg)
                    {:else}
                      N/A
                    {/if}
                  </td>
                </tr>
                <tr>
                  <td class="py-1 font-semibold">Eye color:</td>
                  <td class="py-1">{$likenessStore.profile.attributes.eyeColor || 'N/A'}</td>
                </tr>
                <tr>
                  <td class="py-1 font-semibold">Hair color:</td>
                  <td class="py-1">{$likenessStore.profile.attributes.hairColor || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Union affiliations -->
          {#if $likenessStore.profile.affiliations[0].union}
            <div>
              <h2 class="text-base font-semibold text-[#202225] mb-2">Union affiliations</h2>
              <table class="w-full text-base text-[#72717b]">
                <tbody>
                  {#each $likenessStore.profile.affiliations as aff (aff.memberId)}
                    <tr>
                      <td class="py-1 font-semibold w-1/5">{aff.union}</td>
                      <td class="py-1">{aff.memberId}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="">
      <!-- Edit button -->
      <div class="flex justify-end mb-8">
        <button
          disabled={$likenessStore.ui.loading}
          onclick={() => (currentStep = 2)}
          class="bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:bg-[#5a4bd1] transition-colors"
        >
          Edit licensing
        </button>
      </div>

      <!-- Sections -->
      <div class="flex flex-col gap-8 text-base">
        <!-- Licensing types -->
        <div>
          <h2 class="text-[18px] font-semibold text-dark mb-3">Licensing types</h2>
          <div class="flex flex-col gap-4">
            {#each enabledLicenseTypes as license (license.id)}
              <div class="flex justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1.5">
                    <Checkmark />
                    <span class="font-semibold text-dark">{license.label}</span>
                  </div>
                  <p class="text-[#747474] leading-relaxed pl-6">
                    {license.description}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <span class="text-sm font-semibold text-dark"
                    >$ {$likenessStore.licensing.licensePrices[license.id]}</span
                  >
                  <span class="text-[10px] text-[#7a7a8a] ml-1">USD</span>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Permitted uses -->
        <div>
          <h2 class="text-[18px] font-semibold text-dark mb-3">Permitted uses</h2>
          {#each enabledPermittedUses as use (use.id)}
            <div class="flex items-center gap-2 mb-1.5">
              <Checkmark />
              <span class="font-semibold text-dark">{use.label}</span>
            </div>
            <p class=" text-[#747474] leading-relaxed pl-6">
              {use.description}
            </p>
          {/each}
        </div>

        <!-- Allow minor retouching -->
        <div>
          <h2 class="text-[18px] font-semibold text-dark mb-3">Allow minor retouching?</h2>

          <div class="flex items-center gap-2">
            {#if $likenessStore.licensing.allowRetouching === 'yes'}
              <Checkmark />
              <span class="font-semibold text-dark">Yes</span>
            {:else}
              <Cross />
              <span class="font-semibold text-dark">No</span>
            {/if}
          </div>
        </div>

        <!-- Approve final use -->
        <div>
          <h2 class="text-[18px] font-semibold text-dark mb-3">Approve final use?</h2>
          <div class="flex items-center gap-2">
            {#if $likenessStore.licensing.approveFinalUse === 'yes'}
              <Checkmark />
              <span class="font-semibold text-dark">Yes</span>
            {:else}
              <Cross />
              <span class="font-semibold text-dark">No</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="flex justify-end gap-1.5 mt-12.5">
  {#if onSaveDraft}
    <button
      class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-cream border border-[#ddd4cc] disabled:bg-[#e1dddb] text-dark"
      disabled={$likenessStore.ui.loading}
      onclick={onSaveDraft}
    >
      Save as draft
    </button>
  {/if}
  <button
    class="text-sm font-medium rounded-sm h-9.5 px-7.5 bg-primary disabled:bg-[#e1dddb] text-cream"
    disabled={$likenessStore.ui.loading}
    onclick={onSubmit}
  >
    {#if $likenessStore.ui.loading}
      <div class="loading loading-dots"></div>
    {:else}
      Save and Publish
    {/if}
  </button>
</div>
