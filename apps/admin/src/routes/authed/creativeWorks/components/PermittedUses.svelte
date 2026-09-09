<script lang="ts">
  import { PERMITTED_USES } from '../constants/constants'
  import { workStore } from '../stores/work-store'
</script>

<div class="space-y-4.5">
  <h3 class=" text-base font-medium text-left text-dark">Permitted uses</h3>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 max-w-75">
    {#each PERMITTED_USES as use (use.id)}
      <label class="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={$workStore.licensing.permittedUses[use.id]}
          onchange={() => workStore.setPermittedUse(use.id, !$workStore.licensing.permittedUses[use.id])}
          class="checkbox size-5 rounded-[3px] border rgba(112, 112, 112, 0.25) bg-[#eae6e2]"
        />
        <span class="text-base font-medium leading-[1.13px] text-left text-[#202225]">{use.label}</span>
      </label>
    {/each}
  </div>
</div>
