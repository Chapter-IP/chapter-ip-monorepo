<script lang="ts">
  import { workStore } from '../stores/work-store'

  const MIN_PRICE = 0.5

  type LicenseType = {
    id: string
    label: string
    description: string
  }

  let { license }: { license: LicenseType } = $props()

  const isEnabled = $derived($workStore.licensing.licenseTypes[license.id])
  const isPriceTooLow = (value: string) => value !== '' && Number(value) < MIN_PRICE
</script>

<div class="flex items-start gap-4">
  <!-- Toggle switch (Zeplin style) -->
  <button
    type="button"
    role="switch"
    aria-checked={isEnabled}
    onclick={() => workStore.setLicenseTypeEnabled(license.id, !isEnabled)}
    class="relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out"
    class:bg-primary={isEnabled}
    class:border-primary={isEnabled}
    class:bg-[#eae6e2]={!isEnabled}
    class:border-[#ddd]={!isEnabled}
  >
    <span
      class="pointer-events-none relative inline-flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out"
      class:translate-x-[24px]={isEnabled}
      class:translate-x-[1px]={!isEnabled}
    >
      {#if isEnabled}
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#7C3AED"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
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

  <div class="flex flex-col w-full">
    <div class="flex items-start justify-between gap-3">
      <p class="text-base font-semibold text-[#202225]">{license.label}</p>

      <div
        class="flex flex-col items-end shrink-0 text-[#30364b] transition-opacity"
        class:opacity-100={isEnabled}
        class:opacity-40={!isEnabled}
        class:pointer-events-none={!isEnabled}
      >
        <div class="flex items-center border border-[#dbdbdb] rounded-sm bg-white overflow-hidden text-sm h-10.5">
          <span class="px-2.5 text-[#30364b]">$</span>
          <input
            type="number"
            min="0.5"
            value={$workStore.licensing.licensePrices[license.id]}
            oninput={(e) => workStore.setLicenseTypePrice(license.id, e.currentTarget.value)}
            onblur={(e) => {
              const val = e.currentTarget.value
              if (val !== '' && Number(val) < MIN_PRICE) {
                e.currentTarget.value = String(MIN_PRICE)
                workStore.setLicenseTypePrice(license.id, String(MIN_PRICE))
              }
            }}
            onwheel={(e) => e.preventDefault()}
            placeholder="USD"
            class="flex-1 h-full w-20 font-medium focus:outline-none pr-2 text-[#30364b]"
          />
          <span class="px-2.5 text-[10px] text-[#30364b]/50 whitespace-nowrap">USD</span>
        </div>

        {#if isEnabled && ($workStore.licensing.licensePrices[license.id] === '' || isPriceTooLow($workStore.licensing.licensePrices[license.id]))}
          <p class="text-xs font-medium text-red-600 mt-1">Minimum price is $0.50</p>
        {/if}
      </div>
    </div>
    <p class="text-base font-medium text-[#747474] max-w-150">{license.description}</p>
  </div>
</div>
