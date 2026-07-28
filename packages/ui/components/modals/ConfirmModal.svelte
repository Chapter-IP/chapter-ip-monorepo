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
    onClose?: () => void
    onSubmit?: () => void | Promise<void>
    onSecondary?: () => void | Promise<void>
    withBackButton?: boolean
  }

  let {
    title,
    description,
    onClose,
    submitText,
    secondaryText,
    onSubmit,
    onSecondary,
    withBackButton = true,
    close,
    isOpen,
  }: TConfirmModalProps = $props()

  async function handleSubmit() {
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

      <div class="flex space-x-4 mt-8 w-full justify-center">
        {#if secondaryText}
          <button
            class="btn bg-[#6734ff] text-white px-12 py-6 rounded-md text-base w-[350px]"
            onclick={handleSecondary}>{secondaryText}</button
          >
        {/if}
        <button class="btn bg-[#6734ff] text-white px-12 py-6 rounded-md text-base w-[350px]" onclick={handleSubmit}
          >{submitText}</button
        >
      </div>
    </div>
  </Base>
{/if}
