<script lang="ts">
  import { ADDITIONAL_TERMS } from '../constants/constants'
  import { workStore } from '../stores/work-store'
</script>

<div class="space-y-4">
  <h3 class="text-base font-semibold text-dark font-heading">Additional information</h3>

  <div class="grid grid-cols-1 gap-y-6">
    {#each ADDITIONAL_TERMS as term (term.key)}
      <label class="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={$workStore.licensing[term.key]}
          onchange={() => workStore.setAdditionalInfo(term.key, !$workStore.licensing[term.key])}
          class="checkbox mt-0.5"
        />
        <div>
          <p class="text-sm font-semibold text-dark">{term.label}</p>
          <p class="text-xs text-[#71707a] mt-1 max-w-md">{term.description}</p>
        </div>
      </label>
    {/each}
  </div>
</div>
