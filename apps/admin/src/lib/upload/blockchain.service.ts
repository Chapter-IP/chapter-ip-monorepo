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

export default class BlockchainService {
  constructor(private readonly accessToken: string) {
    initProvider(accessToken)
  }

  async updateContentPrices(tokenId: string, prices: SetPricesInput): Promise<void> {
    const populatedTxs = await this.createSetPricesTransaction(tokenId, prices)

    if (populatedTxs.length === 0) {
      return
    }

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

  private async createSetPricesTransaction(tokenId: string, { oneTimePrice, lifetimePrice = 0 }: SetPricesInput) {
    const contentContract = await this.getContentContract()
    const prices = [
      ...(oneTimePrice > 0 ? [{ licenseType: LICENSE_TYPE_VALUES.oneTime, price: oneTimePrice }] : []),
      ...(lifetimePrice > 0 ? [{ licenseType: LICENSE_TYPE_VALUES.lifetime, price: lifetimePrice }] : []),
    ]

    return await Promise.all(
      prices.flatMap(({ licenseType, price }) => [
        contentContract.setLicensePriceFiat.populateTransaction(tokenId, licenseType, price * FIAT_PRICE_MULTIPLIER),
        contentContract.setLicensePriceToken.populateTransaction(tokenId, licenseType, price * TOKEN_PRICE_MULTIPLIER),
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
