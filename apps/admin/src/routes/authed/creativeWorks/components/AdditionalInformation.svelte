<script lang="ts">
  import { ADDITIONAL_TERMS } from '../constants/constants'
  import { workStore } from '../stores/work-store'
</script>

<div class="space-y-4.5">
  <h3 class=" text-dark text-base font-medium">Additional information</h3>

  <div class="grid grid-cols-1 gap-y-6.25">
    {#each ADDITIONAL_TERMS as term (term.key)}
      <label class="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={$workStore.licensing[term.key]}
          onchange={() => workStore.setAdditionalInfo(term.key, !$workStore.licensing[term.key])}
          class="checkbox rounded-[3px] border rgba(112, 112, 112, 0.25) border-solid bg-[#eae6e2] size-5"
        />
        <div class="space-y-0.5">
          <p class="text-base font-medium text-[#202225]">{term.label}</p>
          <p class="text-sm font-medium text-[#747474]">{term.description}</p>
        </div>
      </label>
    {/each}
  </div>
</div>
