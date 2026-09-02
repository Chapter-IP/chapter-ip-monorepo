<script lang="ts">
  import Toggle from './Toggle.svelte'
  import type { Readable } from 'svelte/store'

  const MIN_PRICE = 0.5

  type LicenseType = {
    id: string
    label: string
    description: string
  }

  type LicenseState = {
    licensing: {
      licenseTypes: Record<string, boolean>
      licensePrices: Record<string, string>
    }
  }

  type LicensingStore = Readable<LicenseState> & {
    setLicenseTypeEnabled: (id: string, value: boolean) => void
    setLicenseTypePrice: (id: string, value: string) => void
  }

  let { license, store }: { license: LicenseType; store: LicensingStore } = $props()

  const isEnabled = $derived($store.licensing.licenseTypes[license.id])
  const isPriceTooLow = (value: string) => value !== '' && Number(value) < MIN_PRICE
</script>

<div class="flex items-start gap-4">
  <Toggle checked={isEnabled} onToggle={() => store.setLicenseTypeEnabled(license.id, !isEnabled)} />

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
            value={$store.licensing.licensePrices[license.id]}
            oninput={(e) => store.setLicenseTypePrice(license.id, e.currentTarget.value)}
            onblur={(e) => {
              const val = e.currentTarget.value
              if (val !== '' && Number(val) < MIN_PRICE) {
                e.currentTarget.value = String(MIN_PRICE)
                store.setLicenseTypePrice(license.id, String(MIN_PRICE))
              }
            }}
            onwheel={(e) => e.preventDefault()}
            placeholder="USD"
            class="flex-1 h-full w-20 font-medium focus:outline-none pr-2 text-[#30364b]"
          />
          <span class="px-2.5 text-[10px] text-[#30364b]/50 whitespace-nowrap">USD</span>
        </div>

        {#if isEnabled && ($store.licensing.licensePrices[license.id] === '' || isPriceTooLow($store.licensing.licensePrices[license.id]))}
          <p class="text-xs font-medium text-red-600 mt-1">Minimum price is $0.50</p>
        {/if}
      </div>
    </div>
    <p class="text-base font-medium text-[#747474] max-w-150">{license.description}</p>
  </div>
</div>
