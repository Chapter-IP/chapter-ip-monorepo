<script lang="ts">
  import type { Snippet } from 'svelte'

  export type ProgressModalDescriptionKind = 'upload' | 'download'

  export type ProgressModalProps = {
    percent: number
    subtitle: string
    descriptionKind: ProgressModalDescriptionKind
    children?: Snippet
  }

  let { percent, subtitle, descriptionKind, children }: ProgressModalProps = $props()

  const actionLabel = $derived(descriptionKind === 'upload' ? 'upload' : 'download')
  const completionLabel = $derived(descriptionKind === 'upload' ? 'upload' : 'download')
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center px-3"
  role="dialog"
  aria-modal="true"
  aria-labelledby="progress-modal-heading"
  aria-describedby="progress-modal-description"
>
  <div class="fixed inset-0 bg-[rgba(37,37,55,0.85)]" aria-hidden="true"></div>

  <div
    class="relative z-10 flex w-full max-w-[900px] flex-col rounded-[12px] border border-[#1A1A2E]/20 bg-cream px-6 py-7 shadow-lg md:px-10 md:py-8"
  >
    <h2 id="progress-modal-heading" class="font-heading text-[22px] font-semibold text-dark" aria-live="polite">
      {percent}% complete
    </h2>

    <p class="mt-2 font-sans text-base font-semibold text-dark">{subtitle}</p>

    <p id="progress-modal-description" class="mt-4 text-sm leading-relaxed text-[#72717b]">
      Please <span class="font-semibold text-dark">do not close, refresh, or navigate away</span> from this page until
      the
      {actionLabel} is complete. Leaving this page before the process finishes may interrupt the {actionLabel} and require
      you to start again. This window will update automatically once your {completionLabel} has successfully completed.
    </p>

    {#if children}
      {@render children()}
    {/if}
  </div>
</div>
