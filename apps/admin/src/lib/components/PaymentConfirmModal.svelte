<script lang="ts">
  import ArrowLeft from '$lib/assets/arrow-down-left.svg'

  let {
    close,
    isOpen,
    variant,
    publisherName,
    paymentMethod,
    amount,
    onCancel,
    onConfirm,
  }: {
    close: () => boolean
    isOpen: boolean
    variant: 'accept' | 'decline'
    publisherName: string
    paymentMethod: string
    amount: number
    onCancel?: () => void
    onConfirm?: (reason: string) => void | Promise<void>
  } = $props()

  let reason = $state('')

  const title = $derived(variant === 'accept' ? 'Accept payment' : 'Decline payment')
  const description = $derived(
    variant === 'accept'
      ? `Please note that you are about to confirm payment to @${publisherName} via ${paymentMethod} in the amount of $${(amount / 100).toFixed(2).replace('.', ',')}.`
      : `Please note that you are about to decline payment to @${publisherName} in the amount of $${(amount / 100).toFixed(2).replace('.', ',')}.`,
  )
  const confirmLabel = $derived(variant === 'accept' ? 'Accept Payment' : 'Decline Payment')
  const confirmBg = $derived(variant === 'accept' ? 'bg-[#499b60]' : 'bg-[#f80000]')
</script>

{#if isOpen}
  <div role="dialog" class="z-20 flex justify-center items-center fixed top-5 bottom-5 left-0 right-0 mx-3">
    <div
      class="flex flex-col max-w-216.5 relative bg-cream rounded-xl w-full overflow-y-scroll max-h-screen px-5 pt-3.75 pb-25.75"
    >
      <button
        type="button"
        class="flex items-center justify-start text-sm font-medium text-[#707070]/50 gap-2 cursor-pointer"
        onclick={() => close()}
      >
        <img src={ArrowLeft} alt="Back" class="size-3.5 rotate-90" />
        Back
      </button>
      <button
        type="button"
        class="text-[20px] text-[#70707080] rounded-none absolute right-3 top-2 cursor-pointer"
        onclick={() => close()}>✕</button
      >
      <div class="px-7.5 pt-11">
        <div class="flex flex-col">
          <div class="space-y-2">
            <h3 class="text-[22px] font-semibold text-left text-dark">{title}</h3>
            <p class="text-base text-[#747474] leading-6">{description}</p>
          </div>

          <div class="flex flex-col gap-1 mt-3.75">
            <label for="reason" class="text-sm text-[#71707a]">Reason for declining payment?</label>
            <textarea
              id="reason"
              bind:value={reason}
              class="w-full h-25 border border-[#ddd] rounded bg-white p-3 text-sm resize-none"></textarea>
          </div>

          <div class="flex gap-4 mt-7.5 justify-end">
            <button
              class="px-8 py-2.5 rounded bg-primary text-cream text-sm font-medium"
              onclick={() => {
                close()
                onCancel?.()
              }}
            >
              Cancel
            </button>
            <button
              class="px-8 py-2.5 rounded {confirmBg} text-cream text-sm font-medium"
              onclick={async () => {
                close()
                await onConfirm?.(reason)
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
