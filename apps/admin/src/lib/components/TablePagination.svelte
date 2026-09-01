<script lang="ts">
  import Code from '$lib/assets/code.svg'

  type Props = {
    from: number
    to: number
    total: number
    label: string
    previousDisabled?: boolean
    nextDisabled?: boolean
    onPrevious: () => void | Promise<void>
    onNext: () => void | Promise<void>
  }

  let { from, to, total, label, previousDisabled = false, nextDisabled = false, onPrevious, onNext }: Props = $props()
</script>

<div class="flex flex-col gap-2 pt-1.5 text-[13px] font-medium text-[#b6b4b7] sm:flex-row sm:justify-between">
  <span class="text-dark/60">Showing {from}-{to} of {total} {label}</span>
  <div class="flex shrink-0 items-center gap-1.5">
    <button
      type="button"
      onclick={onPrevious}
      disabled={previousDisabled}
      class="inline-flex items-center gap-1 cursor-pointer hover:text-[#555] disabled:cursor-default disabled:opacity-30"
    >
      <img src={Code} alt="Previous" class="h-3 rotate-180 inline-block" />
      Previous
    </button>
    <button
      type="button"
      onclick={onNext}
      disabled={nextDisabled}
      class="ml-4.75 inline-flex items-center gap-1 cursor-pointer hover:text-[#555] disabled:cursor-default disabled:opacity-30"
    >
      Next
      <img src={Code} alt="Next" class="size-3 inline-block" />
    </button>
  </div>
</div>
