<script lang="ts">
  import { PERMITTED_USES } from '../constants/constants'
  import { workStore } from '../stores/work-store'
</script>

<div class="space-y-4">
  <h3 class="text-base font-semibold text-dark font-heading">Permitted uses</h3>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
    {#each PERMITTED_USES as use (use.id)}
      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={$workStore.licensing.permittedUses[use.id]}
          onchange={() => workStore.setPermittedUse(use.id, !$workStore.licensing.permittedUses[use.id])}
          class="checkbox"
        />
        <span class="text-sm font-semibold text-[#1A1A2E]">{use.label}</span>
      </label>
    {/each}
  </div>
</div>
