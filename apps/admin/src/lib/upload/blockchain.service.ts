import { ethers, initProvider, getSigner } from '@repo/fe-evm-provider'
import { forwardTransaction } from '@repo/fe-services'
import { LICENSE_TYPE_VALUES } from '@repo/content-types/content'
import { authStore } from '$lib'
import { configStore, ContractName } from '$lib/stores/config.svelte'

const TX_TIMEOUT = 90_000
const FIAT_PRICE_MULTIPLIER = 100
const TOKEN_PRICE_MULTIPLIER = 10 ** 6

export type SetPricesInput = {
  oneTimePrice: number
  lifetimePrice?: number
}

type LicenseTarget = {
  licenseType: number
  price: number
}

type CurrentLicensePrices = {
  fiat?: number
  token?: number
}

export default class BlockchainService {
  constructor(private readonly accessToken: string) {
    initProvider(accessToken)
  }

  async updateContentPrices(tokenId: string, prices: SetPricesInput): Promise<void> {
    const targets = this.getPriceTargets(prices)

    if (targets.length === 0) {
      return
    }

    const currentPrices = await this.getOnChainPrices(tokenId, targets)
    const changedTargets = targets.filter(
      (target) => !this.isPriceUnchanged(target, currentPrices.get(target.licenseType)),
    )

    if (changedTargets.length === 0) {
      return
    }

    const populatedTxs = await this.createSetPricesTransactions(tokenId, changedTargets)
    const provider = await this.getProvider()

    for (const tx of populatedTxs) {
      const hash = await this.forwardTransaction(tx)
      const receipt = await provider.waitForTransaction(hash, 1, TX_TIMEOUT)

      if (!receipt || receipt.status === 0) {
        throw new Error('Transaction failed')
      }
    }
  }

  async mintWithPrices(prices: SetPricesInput): Promise<string> {
    const userAddress = await this.getUserAddress()
    const mintPopulatedTx = await this.createMintTransaction(userAddress, prices)

    const txHash = await this.forwardTransaction(mintPopulatedTx)
    const tokenId = await this.extractTokenIdFromTransaction(txHash)

    return String(tokenId)
  }

  private async getContentContract() {
    const signer = await getSigner()
    return configStore.getContract(ContractName.CONTENT_NFT, signer)
  }

  private async getProvider() {
    const signer = await getSigner()
    const provider = signer.provider

    if (!provider) {
      throw new Error('Provider is not initialized')
    }

    return provider
  }

  private getPriceTargets({ oneTimePrice, lifetimePrice = 0 }: SetPricesInput): LicenseTarget[] {
    return [
      ...(oneTimePrice > 0 ? [{ licenseType: LICENSE_TYPE_VALUES.oneTime, price: oneTimePrice }] : []),
      ...(lifetimePrice > 0 ? [{ licenseType: LICENSE_TYPE_VALUES.lifetime, price: lifetimePrice }] : []),
    ]
  }

  private async getOnChainPrices(
    tokenId: string,
    targets: LicenseTarget[],
  ): Promise<Map<number, CurrentLicensePrices>> {
    const contentContract = await this.getContentContract()
    const currentPrices = new Map<number, CurrentLicensePrices>()

    for (const { licenseType } of targets) {
      try {
        const [fiat, token] = await Promise.all([
          contentContract.getLicensePriceFiat(tokenId, licenseType),
          contentContract.getLicensePriceToken(tokenId, licenseType),
        ])
        currentPrices.set(licenseType, { fiat: Number(fiat), token: Number(token) })
      } catch {
        currentPrices.set(licenseType, {})
      }
    }

    return currentPrices
  }

  private isPriceUnchanged({ price }: LicenseTarget, current: CurrentLicensePrices | undefined) {
    return (
      current?.fiat === Math.round(price * FIAT_PRICE_MULTIPLIER) &&
      current?.token === Math.round(price * TOKEN_PRICE_MULTIPLIER)
    )
  }

  private async createSetPricesTransactions(tokenId: string, targets: LicenseTarget[]) {
    const contentContract = await this.getContentContract()

    return await Promise.all(
      targets.flatMap(({ licenseType, price }) => [
        contentContract.setLicensePriceFiat.populateTransaction(
          tokenId,
          licenseType,
          Math.round(price * FIAT_PRICE_MULTIPLIER),
        ),
        contentContract.setLicensePriceToken.populateTransaction(
          tokenId,
          licenseType,
          Math.round(price * TOKEN_PRICE_MULTIPLIER),
        ),
      ]),
    )
  }

  private async createMintTransaction(userAddress: string, { oneTimePrice, lifetimePrice = 0 }: SetPricesInput) {
    const contentContract = await this.getContentContract()
    return await contentContract.mintWithPrices.populateTransaction(
      userAddress,
      '',
      '',
      lifetimePrice * FIAT_PRICE_MULTIPLIER,
      lifetimePrice * TOKEN_PRICE_MULTIPLIER, // cred decimals (6 decimals)
      0,
      0,
      0,
      0,
      oneTimePrice * FIAT_PRICE_MULTIPLIER,
      oneTimePrice * TOKEN_PRICE_MULTIPLIER, // cred decimals
      0,
    )
  }

  private parseTransferEvent(receipt: ethers.TransactionReceipt, contentContract: ethers.Contract) {
    return receipt.logs
      .map((log) => {
        try {
          return contentContract.interface.parseLog(log)
        } catch {
          return null
        }
      })
      .find((event: ethers.LogDescription | null) => event?.name === 'Transfer')
  }

  private async getUserAddress() {
    const signer = await getSigner()
    return await signer.getAddress()
  }

  private async forwardTransaction(tx: ethers.ContractTransaction): Promise<string> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Forward transaction timed out')), TX_TIMEOUT)
    })

    try {
      return await Promise.race([forwardTransaction(tx, this.getForwardTransactionOptions()), timeout])
    } finally {
      clearTimeout(timer)
    }
  }

  private getForwardTransactionOptions() {
    return {
      token: authStore.state.accessToken!,
      client_id: import.meta.env.VITE_CLIENT_ID,
      evm_wss: import.meta.env.VITE_CREDENZA_EVM_WSS,
    }
  }

  private async extractTokenIdFromTransaction(txHash: string): Promise<number> {
    const provider = await this.getProvider()
    const receipt = await provider.waitForTransaction(txHash)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (!receipt) {
      throw new Error('Transaction failed')
    }
    const contentContract = await this.getContentContract()

    const transferEvent = this.parseTransferEvent(receipt, contentContract)
    const tokenId = Number(transferEvent?.args.tokenId)

    if (!tokenId) {
      throw new Error('Could not extract token ID from transaction')
    }

    return tokenId
  }
}
