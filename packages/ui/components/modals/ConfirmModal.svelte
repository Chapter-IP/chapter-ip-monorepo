<script lang="ts">
  import { tick } from 'svelte'
  import Base from './Base.svelte'

  export type TConfirmModalProps = {
    id: string
    index: number
    close: () => boolean
    isOpen: boolean
    title: string
    submitText?: string
    secondaryText?: string
    description?: string
    confirmPhrase?: string
    onClose?: () => void
    onSubmit?: () => void | Promise<void>
    onSecondary?: () => void | Promise<void>
    withBackButton?: boolean
  }

  let {
    title,
    description,
    confirmPhrase,
    onClose,
    submitText,
    secondaryText,
    onSubmit,
    onSecondary,
    withBackButton = true,
    close,
    isOpen,
  }: TConfirmModalProps = $props()

  let typedPhrase = $state('')
  const canSubmit = $derived(!confirmPhrase || typedPhrase === confirmPhrase)

  async function handleSubmit() {
    if (!canSubmit) return
    close()
    await tick()
    await onSubmit?.()
  }

  async function handleClose() {
    close()
    await tick()
    onClose?.()
  }

  async function handleSecondary() {
    close()
    await tick()
    await onSecondary?.()
  }
</script>

{#if isOpen}
  <Base onClose={handleClose} isBack={withBackButton}>
    <div class="flex flex-col gap-3 items-start">
      <h3 class="text-[22px] font-semibold">{title}</h3>
      {#if description}
        <p class="text-base font-normal text-[#747474]">{description}</p>
      {/if}

      {#if confirmPhrase}
        <p class="text-sm text-[#747474]">
          Type <span class="font-medium text-[#202025]">{confirmPhrase}</span> to confirm
        </p>
        <input
          type="text"
          class="mt-2 w-full rounded-md border border-[#ddd] bg-white px-3 py-2 text-base text-[#202025]"
          placeholder={confirmPhrase}
          bind:value={typedPhrase}
          autocomplete="off"
        />
      {/if}

      <div class="flex space-x-4 mt-8 w-full justify-center">
        {#if secondaryText}
          <button
            class="btn bg-[#6734ff] text-white px-12 py-6 rounded-md text-base w-[350px]"
            onclick={handleSecondary}>{secondaryText}</button
          >
        {/if}
        <button
          class="btn bg-[#6734ff] text-white px-12 py-6 rounded-md text-base w-[350px] disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!canSubmit}
          onclick={handleSubmit}>{submitText}</button
        >
      </div>
    </div>
  </Base>
{/if}
