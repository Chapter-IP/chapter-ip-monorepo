<script lang="ts">
  import FileImg from '$lib/assets/file_img.svg'
  import type { LikenessDetails } from '@repo/content-types/likeness'

  let {
    likeness,
    byline,
    titleId,
    onClose,
  }: {
    likeness: LikenessDetails
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
        <p class="text-xs leading-4 font-semibold tracking-[0.14em] text-primary uppercase">Likeness License</p>
        <h2 id={titleId} class="mt-1 font-heading text-2xl leading-8 font-semibold text-[#1a1a2e]">
          {likeness.name}
        </h2>
        <p class="mt-1 text-sm leading-5 text-[#6d6a73]">{byline}</p>
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
      {#if likeness.files.length > 0}
        <section aria-label="Files">
          <h3 class="text-base leading-5 font-semibold text-dark">Files</h3>
          <div class="mt-3 flex flex-wrap gap-2">
            {#each likeness.files as file (file)}
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

      <section aria-label="Biography">
        <h3 class="text-base leading-5 font-semibold text-dark">Bio</h3>
        <p class="mt-2 whitespace-pre-line break-all">{likeness.bio || 'Not specified.'}</p>
      </section>

      <section aria-label="Licenses">
        <h3 class="text-base leading-5 font-semibold text-dark">Licenses</h3>
        {#if likeness.licenses.length > 0}
          <div class="mt-3 grid gap-3">
            {#each likeness.licenses as license (license.id)}
              <div class="border border-[#1a1a2e1a] bg-white p-4">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h4 class="font-semibold text-dark">{license.name}</h4>
                  <p class="font-semibold text-primary">
                    ${license.price}
                  </p>
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

      <section aria-label="Permitted uses and territories" class="grid gap-5 sm:grid-cols-2">
        <div>
          <h3 class="text-base leading-5 font-semibold text-dark">Permitted Uses</h3>
          <p class="mt-2">{likeness.permittedUses.length ? likeness.permittedUses.join(', ') : 'Not specified.'}</p>
        </div>
        <div>
          <h3 class="text-base leading-5 font-semibold text-dark">Territories</h3>
          <p class="mt-2">{likeness.territories.length ? likeness.territories.join(', ') : 'Not specified.'}</p>
        </div>
      </section>

      <section aria-label="Attributes and affiliations" class="grid gap-5 sm:grid-cols-2">
        <div>
          <h3 class="text-base leading-5 font-semibold text-dark">Attributes</h3>
          {#if likeness.attributes.length > 0}
            <dl class="mt-2 grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-1">
              {#each likeness.attributes as attribute (attribute.label)}
                <dt class="font-semibold text-dark">{attribute.label}</dt>
                <dd>{attribute.value}</dd>
              {/each}
            </dl>
          {:else}
            <p class="mt-2">Not specified.</p>
          {/if}
        </div>
        <div>
          <h3 class="text-base leading-5 font-semibold text-dark">Affiliations</h3>
          {#if likeness.affiliations.length > 0}
            <dl class="mt-2 grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-1">
              {#each likeness.affiliations as affiliation (`${affiliation.union}-${affiliation.memberId}`)}
                <dt class="font-semibold text-dark">{affiliation.union || 'Member'}</dt>
                <dd>{affiliation.memberId || 'N/A'}</dd>
              {/each}
            </dl>
          {:else}
            <p class="mt-2">Not specified.</p>
          {/if}
        </div>
      </section>

      <section aria-label="Approval terms">
        <h3 class="text-base leading-5 font-semibold text-dark">Approval Terms</h3>
        <dl class="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <dt class="font-semibold text-dark">Retouching</dt>
            <dd>{likeness.allowRetouching ? 'Allowed' : 'Not allowed'}</dd>
          </div>
          <div>
            <dt class="font-semibold text-dark">Final approval</dt>
            <dd>{likeness.approveFinalUse ? 'Required' : 'Not required'}</dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</div>
