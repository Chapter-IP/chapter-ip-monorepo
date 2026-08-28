<script lang="ts">
  import { tick } from 'svelte'
  import { ModalBase } from '@repo/ui-components'

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

  async function handleClose() {
    close()
    await tick()
  }

  async function handleCancel() {
    close()
    await tick()
    onCancel?.()
  }

  async function handleConfirm() {
    close()
    await tick()
    await onConfirm?.(reason)
  }
</script>

{#if isOpen}
  <ModalBase onClose={handleClose} isBack>
    <div class="flex flex-col">
      <div class="space-y-2">
        <h3 class="text-[22px] font-semibold text-left text-dark">{title}</h3>
        <p class="text-base text-[#747474] leading-6">{description}</p>
      </div>

      <div class="flex flex-col gap-1 mt-3.75">
        <label for="reason" class="text-sm text-[#71707a]">Reason (optional)</label>
        <textarea
          id="reason"
          bind:value={reason}
          class="w-full h-25 border border-[#ddd] rounded bg-white p-3 text-sm resize-none"></textarea>
      </div>

      <div class="flex gap-4 mt-7.5 justify-end">
        <button class="px-8 py-2.5 rounded bg-primary text-cream text-sm font-medium" onclick={handleCancel}>
          Cancel
        </button>
        <button class="px-8 py-2.5 rounded {confirmBg} text-cream text-sm font-medium" onclick={handleConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </ModalBase>
{/if}
