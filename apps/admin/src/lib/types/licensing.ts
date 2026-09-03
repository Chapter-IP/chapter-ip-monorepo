import type { Readable } from 'svelte/store'

export type LicenseType = {
  id: string
  label: string
  description: string
}

export type LicenseState = {
  licensing: {
    licenseTypes: Record<string, boolean>
    licensePrices: Record<string, string>
  }
}

export type LicensingStore = Readable<LicenseState> & {
  setLicenseTypeEnabled: (id: string, value: boolean) => void
  setLicenseTypePrice: (id: string, value: string) => void
}
