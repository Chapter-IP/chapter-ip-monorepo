<script lang="ts">
  import { PERMITTED_USES } from '../constants/constants'
  import { likenessStore } from '../stores/likeness-store'
  import Toggle from './Toggle.svelte'

  let allPermitted = $derived(PERMITTED_USES.every((u) => $likenessStore.licensing.permittedUses[u.id]))

  function toggleAllUses() {
    likenessStore.setAllPermittedUses(
      PERMITTED_USES.map((u) => u.id),
      !allPermitted,
    )
  }
</script>

<div class="space-y-4">
  <div class="flex items-end justify-between">
    <div>
      <p class="text-xs text-[#71707a]">A minimum of one must be selected</p>
      <h3 class="text-base font-semibold text-dark">Permitted uses <span class="text-[#ff0000]">*</span></h3>
    </div>
    <button type="button" onclick={toggleAllUses} class="text-sm text-primary flex items-center gap-1 hover:underline">
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <path
          d="M1 5L4.5 8.5L11 1"
          stroke="#7C3AED"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {allPermitted ? 'Deselect all' : 'Select all'}
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
    {#each PERMITTED_USES as use (use.id)}
      <div class="flex items-start gap-3">
        <Toggle
          checked={$likenessStore.licensing.permittedUses[use.id]}
          onToggle={() => likenessStore.setPermittedUse(use.id, !$likenessStore.licensing.permittedUses[use.id])}
        />
        <div>
          <p class="text-sm font-semibold text-dark">{use.label}</p>
          <p class="text-xs text-[#71707a] mt-1">{use.description}</p>
        </div>
      </div>
    {/each}
  </div>
</div>
