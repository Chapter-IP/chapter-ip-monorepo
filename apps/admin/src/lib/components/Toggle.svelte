<script lang="ts">
  let {
    checked = false,
    onToggle,
  }: {
    checked?: boolean
    onToggle: () => void
  } = $props()
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  onclick={onToggle}
  class="relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out"
  class:bg-primary={checked}
  class:border-primary={checked}
  class:bg-[#eae6e2]={!checked}
  class:border-[#ddd]={!checked}
>
  <span
    class="pointer-events-none relative inline-flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out"
    class:translate-x-[24px]={checked}
    class:translate-x-[1px]={!checked}
  >
    {#if checked}
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M1 4L3.5 6.5L9 1" stroke="#7C3AED" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    {:else}
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <path
          d="M1 1L8 8M8 1L1 8"
          stroke="#202225"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.25"
        />
      </svg>
    {/if}
  </span>
</button>
