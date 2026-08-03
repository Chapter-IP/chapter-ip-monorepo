import { ethers, initProvider, getSigner } from '@repo/fe-evm-provider'
import { configStore, ContractName } from '$lib/stores/config.svelte'

const LICENSE_TYPES_BY_PRICE = {
  oneTime: 2,
  lifetime: 0,
} as const

export type SetPricesInput = {
  oneTimePrice: number
  lifetimePrice?: number
}

export default class BlockchainService {
  constructor(accessToken: string) {
    initProvider(accessToken)
  }

  async createSetPricesTransaction(tokenId: string, { oneTimePrice, lifetimePrice = 0 }: SetPricesInput) {
    const signer = await getSigner()
    const contentContract = configStore.getContract(ContractName.CONTENT_NFT, signer)
    const prices = [
      ...(oneTimePrice > 0 ? [{ licenseType: LICENSE_TYPES_BY_PRICE.oneTime, price: oneTimePrice }] : []),
      ...(lifetimePrice > 0 ? [{ licenseType: LICENSE_TYPES_BY_PRICE.lifetime, price: lifetimePrice }] : []),
    ]

    return await Promise.all(
      prices.flatMap(({ licenseType, price }) => [
        contentContract.setLicensePriceFiat.populateTransaction(tokenId, licenseType, price * 100),
        contentContract.setLicensePriceToken.populateTransaction(tokenId, licenseType, price * 10 ** 6),
      ]),
    )
  }

  async createMintTransaction(
    userAddress: string,
    { oneTimePrice, lifetimePrice = 0 }: { oneTimePrice: number; lifetimePrice?: number },
  ) {
    const signer = await getSigner()
    const contentContract = configStore.getContract(ContractName.CONTENT_NFT, signer)
    return await contentContract.mintWithPrices.populateTransaction(
      userAddress,
      '',
      '',
      lifetimePrice * 100,
      lifetimePrice * 10 ** 6, // cred decimals (6 decimals)
      0,
      0,
      0,
      0,
      oneTimePrice * 100,
      oneTimePrice * 10 ** 6, // cred decimals
      0,
    )
  }

  async getEthersProvider(accessToken: string) {
    const provider = await initProvider(accessToken)
    return new ethers.BrowserProvider(provider)
  }

  parseTransferEvent(receipt: ethers.TransactionReceipt, contentContract: ethers.Contract) {
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

  async getUserAddress() {
    const signer = await getSigner()
    return await signer.getAddress()
  }
}
