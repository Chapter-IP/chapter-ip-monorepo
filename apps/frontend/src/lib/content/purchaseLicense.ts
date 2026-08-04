import { goto } from '$app/navigation'
import { authStore } from '$lib'
import { passportStore } from '$lib/passport.store'
import { configStore, ContractName } from '$lib/stores/config.svelte'
import { Passport } from '@credenza3/passport-evm'
import { ethers, initProvider, getSigner } from '@repo/fe-evm-provider'
import { forwardTransaction, snowtraceUrl } from '@repo/fe-services'
import { LICENSE_TYPE_VALUES } from '@repo/content-types/content'
import { get } from 'svelte/store'

type PurchaseLicenseType = `${typeof LICENSE_TYPE_VALUES.lifetime}` | `${typeof LICENSE_TYPE_VALUES.oneTime}`

export type PurchasableContent = {
  contentTokenId?: string | number | null
  name: string
}

export type PurchasableLicense = {
  id: string
  name: string
}

type PurchaseLicenseInput = {
  purchase: PurchasableContent
  license: PurchasableLicense
}

type PassportPaymentEvent = {
  type: string
  data?: { hash?: string }
  results?: {
    hash?: string
    items?: Array<{
      tx?: string
      hash?: string
      outcome?: {
        voucher: TLicenseVoucher
        sig: string
      }
    }>
  }
}

type TLicenseVoucher = Record<string, number | string>

type PurchaseContext = {
  passport: Passport
  accessToken: string
  purchase: PurchasableContent
  license: PurchasableLicense
  licenseType: PurchaseLicenseType
  contentTokenId: string
  contentContract: string
  licenseContractAddress: string
}

export type PassportPayment = { kind: 'card'; voucher: TLicenseVoucher; sig: string } | { kind: 'direct'; hash: string }

const LICENSE_TYPES: Partial<Record<string, PurchaseLicenseType>> = {
  perpetual: `${LICENSE_TYPE_VALUES.lifetime}`,
  'single-use': `${LICENSE_TYPE_VALUES.oneTime}`,
}

export function getPurchaseLicenseType(licenseId: string): PurchaseLicenseType | null {
  return LICENSE_TYPES[licenseId] ?? null
}

function normalizeTokenId(tokenId: PurchasableContent['contentTokenId']): string {
  return tokenId == null ? '' : String(tokenId).trim()
}

export function canPurchaseLicense(purchase: PurchasableContent, license: PurchasableLicense | undefined): boolean {
  return Boolean(license && getPurchaseLicenseType(license.id) && normalizeTokenId(purchase.contentTokenId))
}

export async function purchaseLicense({ purchase, license }: PurchaseLicenseInput): Promise<void> {
  const context = await getPurchaseContext({ purchase, license })
  context.passport.once(Passport.events.ERROR, (error: unknown) => {
    throw error
  })

  let payload: PassportPaymentEvent
  try {
    payload = await requestPassportPayment(context)
  } catch (error) {
    if (error instanceof Error && error.message === 'Payment cancelled') return
    throw error
  }

  const payment = parsePassportPayment(payload)
  const hash = payment.kind === 'card' ? await redeemVoucher(payment, context) : payment.hash

  await goto('/authed/purchases')
  await openPurchaseAlert(context.passport, hash)
}

export function parsePassportPayment(payload: PassportPaymentEvent): PassportPayment {
  const type = payload.type.toUpperCase()
  const firstItem = payload.results?.items?.[0]

  if (type === 'CARD' || type === 'STRIPE') {
    const { voucher, sig } = firstItem?.outcome ?? {}

    if (!voucher || !voucher.nonce || !sig) {
      throw new Error('Missing card payment voucher outcome')
    }
    return { kind: 'card', voucher, sig }
  }

  const hash = payload.data?.hash || payload.results?.hash || firstItem?.tx || firstItem?.hash

  if (!hash) throw new Error('Missing payment transaction hash')
  return { kind: 'direct', hash }
}

async function getPurchaseContext({ purchase, license }: PurchaseLicenseInput): Promise<PurchaseContext> {
  const passport = get(passportStore)
  if (!passport) throw new Error('Passport is not initialized')

  const accessToken = await authStore.getAccessToken()
  if (!accessToken) throw new Error('Missing auth access token for license purchase')

  const licenseType = getPurchaseLicenseType(license.id)
  if (!licenseType) throw new Error(`Unsupported license type: ${license.id}`)

  const contentTokenId = normalizeTokenId(purchase.contentTokenId)
  if (!contentTokenId) throw new Error('Missing content token ID for license purchase')

  return {
    passport,
    accessToken,
    purchase,
    license,
    licenseType,
    contentTokenId,
    contentContract: configStore.getContractAddress(ContractName.CONTENT_NFT),
    licenseContractAddress: configStore.getContractAddress(ContractName.LICENSE_NFT),
  }
}

async function requestPassportPayment(context: PurchaseContext): Promise<PassportPaymentEvent> {
  const paymentEvent = new Promise<PassportPaymentEvent>((resolve, reject) => {
    context.passport.once(Passport.events.PAYMENT, resolve)
    context.passport.once(Passport.events.UI_CLOSED, () => {
      reject(new Error('Payment cancelled'))
    })
  })

  await context.passport.openUI(Passport.pages.PAYMENT, {
    title: `Buy ${context.license.name}`,
    subtitle: context.purchase.name,
    licenses: [
      {
        contractAddress: context.contentContract,
        licenseContractAddress: context.licenseContractAddress,
        licenseType: context.licenseType,
        contentTokenId: context.contentTokenId,
        amount: 1,
      },
    ],
  })

  return paymentEvent
}

async function redeemVoucher(
  payment: { voucher: TLicenseVoucher; sig: string },
  context: PurchaseContext,
): Promise<string> {
  const provider = await initProvider(context.accessToken)
  const ethersProvider = new ethers.BrowserProvider(provider)
  const signer = await getSigner()
  const userAddress = await signer.getAddress()
  const licenseContract = configStore.getContract(ContractName.LICENSE_NFT, signer)
  const populatedTx = await licenseContract.redeem.populateTransaction(
    userAddress.toLowerCase(),
    payment.voucher,
    payment.sig,
  )

  const hash = await forwardTransaction(populatedTx, {
    token: context.accessToken,
    client_id: import.meta.env.VITE_CLIENT_ID,
    evm_wss: import.meta.env.VITE_CREDENZA_EVM_WSS,
  })

  const receipt = await ethersProvider.waitForTransaction(hash)
  if (!receipt) throw new Error('License redemption transaction failed')

  return hash
}

async function openPurchaseAlert(passport: Passport, hash: string): Promise<void> {
  await passport.openUI(Passport.pages.RICH_ALERT, {
    richAlertData: {
      title: 'License Purchased',
      description: 'Your license is available in purchases.',
      action: {
        text: 'View Transaction',
        onClick: () => {
          window.open(`${snowtraceUrl}/tx/${hash}`, '_blank')
          passport.close()
        },
      },
      closeButtonText: 'Close',
    },
  })
}
