<script lang="ts">
  import { EYE_COLOR_OPTIONS, ETHNICITY_OPTIONS, HAIR_COLOR_OPTIONS, UNION_OPTIONS } from '../constants/constants'
  import { getHeightTotalInches, likenessStore } from '../stores/likeness-store'

  const heightCm = $derived(() => {
    const totalInches = getHeightTotalInches($likenessStore.profile.attributes)
    if (totalInches === undefined) return null
    return `(${Math.round(totalInches * 2.54)} cm)`
  })

  const weightKg = $derived(() => {
    const weight = $likenessStore.profile.attributes.weight
    if (!weight || !Number.isFinite(Number(weight))) return null
    return `(${Math.round(Number(weight) * 0.453592)} kg)`
  })
</script>

<div class="space-y-6">
  <h3 class="text-base font-semibold text-left">Physical Attributes</h3>
  <label class="block space-y-3">
    <span class="mb-2 block text-sm text-[#71707a]"> Ethnicity </span>

    <select
      id="ethnicity"
      bind:value={$likenessStore.profile.attributes.ethnicity}
      class="select w-full max-w-[320px] h-11.75 bg-white rounded-sm border border-[#ddd4cc] p-3.75 focus:outline-none text-sm font-medium text-left text-[#71707a]"
    >
      <option value="" disabled>Select one</option>

      {#each ETHNICITY_OPTIONS as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </label>
  <div class="flex gap-17.5">
    <label class="block">
      <span class="mb-2 block text-sm text-[#71707a]">Height<span class="ml-1.5 text-[10px]">{heightCm()}</span></span>
      <div class="flex gap-2">
        <div class="relative w-full max-w-25">
          <input
            id="heightFt"
            type="number"
            bind:value={$likenessStore.profile.attributes.heightFt}
            placeholder="0"
            class="w-full h-11.75 bg-white rounded-sm border border-[#ddd4cc]
            p-3.75 pr-10 focus:border-primary focus:outline-none
            text-sm font-medium text-left text-[#71707a]"
          />

          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71707a] opacity-0.3 font-medium">
            ft.
          </span>
        </div>
        <div class="relative w-full max-w-25">
          <input
            id="heightIn"
            type="number"
            bind:value={$likenessStore.profile.attributes.heightIn}
            placeholder="0"
            class="w-full h-11.75 bg-white rounded-sm border border-[#ddd4cc]
            p-3.75 pr-10 focus:border-primary focus:outline-none
            text-sm font-medium text-left text-[#71707a]"
          />

          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71707a] opacity-0.3 font-medium">
            in.
          </span>
        </div>
      </div>
    </label>
    <label class="block space-y-3">
      <span class="mb-2 block text-sm text-[#71707a]">Weight<span class="ml-1.5 text-[10px]">{weightKg()}</span></span>
      <div class="relative w-full max-w-25">
        <input
          id="weight"
          type="number"
          bind:value={$likenessStore.profile.attributes.weight}
          placeholder="0 lbs"
          class="w-full h-11.75 bg-white rounded-sm border border-[#ddd4cc]
        p-3.75 pr-10 focus:border-primary focus:outline-none
        text-sm font-medium text-left text-[#71707a]"
        />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#71707a] opacity-0.3 font-medium">
          lbs.
        </span>
      </div>
    </label>
  </div>
  <div class="flex justify-between max-w-137.5 gap-2.5">
    <label class="block space-y-3 w-full">
      <span class="mb-2 block text-sm text-[#71707a]">Eye Color</span>
      <select
        id="eyeColor"
        bind:value={$likenessStore.profile.attributes.eyeColor}
        class="select w-full max-w-[320px] h-11.75 bg-white rounded-sm border border-[#ddd4cc] p-3.75 focus:outline-none text-sm font-medium text-left text-[#71707a]"
      >
        <option value="" disabled>Select one</option>
        {#each EYE_COLOR_OPTIONS as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </label>
    <label class="block space-y-3 w-full">
      <span class="mb-2 block text-sm text-[#71707a]">Hair Color</span>
      <select
        id="hairColor"
        bind:value={$likenessStore.profile.attributes.hairColor}
        class="select w-full max-w-[320px] h-11.75 bg-white rounded-sm border border-[#ddd4cc] p-3.75 focus:outline-none text-sm font-medium text-left text-[#71707a]"
      >
        <option value="" disabled>Select one</option>
        {#each HAIR_COLOR_OPTIONS as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="border-t border-[#ddd] my-12.25 mx-10"></div>
  <div class="space-y-3">
    <h3 class="text-base font-semibold text-left">Union Affiliations</h3>

    {#each $likenessStore.profile.affiliations as affiliation, i (i)}
      <div class="flex items-center justify-between max-w-137.5 gap-2.5">
        <label class="block space-y-3 w-full">
          <span class="mb-2 block text-sm text-[#71707a]">Union</span>
          <select
            value={affiliation.union}
            onchange={(e) => likenessStore.updateAffiliation(i, 'union', e.currentTarget.value)}
            class="select w-full max-w-137.5 h-11.75 bg-white rounded-sm border border-[#ddd4cc] p-3.75 focus:border-primary focus:outline-none
           text-sm font-medium text-left text-[#71707a]"
          >
            <option value="" disabled>Select one</option>
            {#each UNION_OPTIONS as opt (opt.value)}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>
        <label class="block space-y-3 w-full">
          <span class="mb-2 block text-sm text-[#71707a]">Union Member ID</span>
          <input
            type="text"
            value={affiliation.memberId}
            oninput={(e) => likenessStore.updateAffiliation(i, 'memberId', e.currentTarget.value)}
            placeholder="Member ID no"
            class="w-full max-w-137.5 h-11.75 bg-white rounded-sm border border-[#ddd4cc] p-3.75 focus:border-primary focus:outline-none
           opacity-0.3 text-sm font-medium text-left text-[#71707a]"
          />
        </label>

        {#if i > 0}
          <button
            type="button"
            onclick={() => likenessStore.removeAffiliation(i)}
            class="mt-6 shrink-0 text-[#71707a] hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        {:else}
          <div class="mt-6 w-4 shrink-0"></div>
        {/if}
      </div>
    {/each}

    <button
      type="button"
      onclick={() => {
        const hasEmpty = $likenessStore.profile.affiliations.some((a) => !a.union || !a.memberId)
        if (!hasEmpty) likenessStore.addAffiliation()
      }}
      class="text-sm text-primary flex items-center gap-2.25"
    >
      <span class="text-3xl font-light">+</span>
      <span>Add another Union Affiliation</span>
    </button>
  </div>
</div>
