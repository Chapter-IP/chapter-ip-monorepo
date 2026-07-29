<script lang="ts">
  import CompatiblePlatforms from '$lib/content/CompatiblePlatforms.svelte'
  import FileImg from '$lib/assets/file_img.svg'
  import type { LocationDetails } from '@repo/content-types/location'

  let {
    location,
    byline,
    titleId,
    onClose,
  }: {
    location: LocationDetails
    byline: string
    titleId: string
    onClose: () => void
  } = $props()

  function closeOnBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
  role="presentation"
  onclick={closeOnBackdrop}
>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    tabindex="-1"
    class="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-[#f5f1ec] p-5 shadow-2xl sm:p-8"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs leading-4 font-semibold tracking-[0.14em] text-primary uppercase">Location License</p>
        <h2 id={titleId} class="mt-1 font-heading text-2xl leading-8 font-semibold text-[#1a1a2e]">
          {location.name}
        </h2>
        {#if byline}
          <p class="mt-1 text-sm leading-5 text-[#6d6a73]">{byline}</p>
        {/if}
      </div>
      <button
        type="button"
        class="btn btn-ghost min-h-10 rounded-none px-3 text-xl leading-none text-[#1a1a2e]"
        aria-label="Close license details"
        onclick={onClose}
      >
        X
      </button>
    </div>

    <div class="mt-6 grid gap-6 text-sm leading-6 text-[#45424d]">
      <section aria-label="Description">
        <h3 class="text-base leading-5 font-semibold text-[#1a1a2e]">Description</h3>
        <p class="mt-2 whitespace-pre-line">{location.description || 'Not specified.'}</p>
      </section>

      <section aria-label="Licenses">
        <h3 class="text-base leading-5 font-semibold text-[#1a1a2e]">Licenses</h3>
        {#if location.licenses.length > 0}
          <div class="mt-3 grid gap-3">
            {#each location.licenses as license (license.id)}
              <div class="border border-[#1a1a2e1a] bg-white p-4">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h4 class="font-semibold text-[#1a1a2e]">{license.name}</h4>
                  <p class="font-semibold text-primary">${license.price}</p>
                </div>
                {#if license.description}
                  <p class="mt-2 text-[#6d6a73]">{license.description}</p>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <p class="mt-2">Not specified.</p>
        {/if}
      </section>

      {#if location.files.length > 0}
        <section aria-label="Files">
          <h3 class="text-base leading-5 font-semibold text-dark">Files</h3>
          <div class="mt-3 flex flex-wrap gap-2">
            {#each location.files as file (file)}
              <div
                class="rounded bg-[#eae6e2] flex justify-center items-center text-[12px] text-[#71707a] py-2 px-3 gap-2"
              >
                <img src={FileImg} alt="fileImg" class="h-4" />
                <span class="truncate max-w-40">{file}</span>
              </div>
            {/each}
          </div>
        </section>
      {/if}

      {#if location.tags.length > 0}
        <section aria-label="Tags">
          <h3 class="text-base leading-5 font-semibold text-[#1a1a2e]">Tags</h3>
          <p class="mt-2">{location.tags.join(', ')}</p>
        </section>
      {/if}

      <CompatiblePlatforms
        headingClass="text-base leading-5 font-semibold text-[#1a1a2e]"
        gridClass="mt-3 grid grid-cols-2 gap-3"
      />
    </div>
  </div>
</div>
