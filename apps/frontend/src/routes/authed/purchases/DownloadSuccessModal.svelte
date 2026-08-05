<script lang="ts">
  let {
    title,
    onClose,
  }: {
    title: string
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
    aria-label="Download complete"
    tabindex="-1"
    class="relative flex w-full max-w-225 flex-col overflow-y-auto rounded-xl bg-cream px-5 py-4 max-h-[90vh]"
  >
    <button
      type="button"
      class="absolute right-3 top-2 cursor-pointer rounded-none text-[20px] text-[#70707080]"
      aria-label="Close download confirmation"
      onclick={onClose}
    >
      ✕
    </button>
    <div class="px-6 py-7">
      <div class="flex flex-col items-start gap-3">
        <h3 class="text-[22px] font-semibold">Download complete</h3>
        <p class="text-base font-normal text-[#747474]">{title}</p>
        <p class="mt-3 text-sm leading-5 text-[#6d6a73]">Your files have been downloaded and saved as a ZIP archive.</p>

        <div class="mt-8 flex w-full justify-center space-x-4">
          <button
            type="button"
            class="btn rounded-md bg-primary px-12 py-6 text-base text-white cursor-pointer"
            onclick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
