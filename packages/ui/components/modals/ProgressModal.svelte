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
    class="relative z-10 flex w-full max-w-[900px] flex-col rounded-[12px] border border-[#1A1A2E]/20 bg-cream px-6 py-8 md:px-[52px] md:py-10"
  >
    <span
      class="pointer-events-none absolute right-6 top-8 flex h-[30px] w-[30px] items-center justify-center text-[#707070]/50 md:right-[52px] md:top-10"
      aria-hidden="true"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </span>

    <h2 id="progress-modal-heading" class="font-heading text-[22px] font-semibold text-dark" aria-live="polite">
      {percent}% complete
    </h2>

    <p class="mt-2 font-sans text-base font-semibold text-[#202225]">{subtitle}</p>

    <div id="progress-modal-description" class="mt-4 space-y-4 font-sans text-base leading-6 text-[#747474]">
      <p>
        Please <span class="font-semibold">do not close, refresh, or navigate away</span> from this page until the
        {descriptionKind} is complete. Leaving this page before the process finishes may interrupt the {descriptionKind}
        and require you to start again.
      </p>
      <p>
        This window will update automatically once your {descriptionKind} has successfully completed.
      </p>
    </div>

    {#if children}
      {@render children()}
    {/if}
  </div>
</div>
