<script lang="ts">
  import FileImg from '$lib/assets/file_img.svg'
  import type { WorkDetails } from '@repo/content-types/works'
  let { work, titleId, onClose }: { work: WorkDetails; titleId: string; onClose: () => void } = $props()
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
  role="presentation"
  onclick={(event) => event.target === event.currentTarget && onClose()}
>
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    tabindex="-1"
    class="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-cream p-5 shadow-2xl sm:p-8"
  >
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Creative Work License</p>
        <h2 id={titleId} class="mt-1 font-heading text-2xl font-semibold text-dark">{work.title}</h2>
        {#if work.authors.length}<p class="mt-1 text-sm text-[#6d6a73]">by {work.authors.join(', ')}</p>{/if}
      </div>
      <button
        type="button"
        class="btn btn-ghost min-h-10 rounded-none px-3 text-xl text-dark"
        aria-label="Close license details"
        onclick={onClose}>X</button
      >
    </div>
    <div class="mt-6 grid gap-6 text-sm leading-6 text-[#45424d]">
      <section aria-label="Work details">
        <h3 class="text-base font-semibold text-dark">Work details</h3>
        <p class="mt-2"><strong>Content type:</strong> {work.contentType || 'Not specified.'}</p>
        <p class="mt-2 whitespace-pre-line">{work.description || 'Not specified.'}</p>
      </section>
      {#if work.genres.length}<section aria-label="Genres">
          <h3 class="text-base font-semibold text-dark">Genres</h3>
          <p class="mt-2">{work.genres.join(', ')}</p>
        </section>{/if}
      <section aria-label="Licenses">
        <h3 class="text-base font-semibold text-dark">Licenses</h3>
        {#if work.licenses.length}<div class="mt-3 grid gap-3">
            {#each work.licenses as license (license.id)}<div class="border border-[#1a1a2e1a] bg-white p-4">
                <div class="flex justify-between gap-4">
                  <h4 class="font-semibold text-dark">{license.name}</h4>
                  <p class="font-semibold text-primary">${license.price}</p>
                </div>
                <p class="mt-2 text-[#6d6a73]">{license.description}</p>
              </div>{/each}
          </div>{:else}<p class="mt-2">Not specified.</p>{/if}
      </section>
      {#if work.files.length}<section aria-label="Files">
          <h3 class="text-base font-semibold text-dark">Files</h3>
          <div class="mt-3 flex flex-wrap gap-2">
            {#each work.files as file (file)}<div
                class="flex items-center gap-2 rounded bg-[#eae6e2] px-3 py-2 text-xs text-[#71707a]"
              >
                <img src={FileImg} alt="" class="h-4" /><span class="max-w-40 truncate">{file}</span>
              </div>{/each}
          </div>
        </section>{/if}
    </div>
  </div>
</div>
