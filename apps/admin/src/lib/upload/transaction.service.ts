import { forwardTransaction } from '@repo/fe-services'
import { authStore } from '$lib'
import { ethers } from '@repo/fe-evm-provider'
import BlockchainService, { type SetPricesInput } from './blockchain.service'
import { configStore, ContractName } from '$lib/stores/config.svelte'

const TX_TIMEOUT = 90_000

export default class TransactionService {
  constructor(private readonly blockchainService: BlockchainService) {}

  async updateContentPrices(accessToken: string, tokenId: string, prices: SetPricesInput): Promise<void> {
    const populatedTxs = await this.blockchainService.createSetPricesTransaction(tokenId, prices)

    if (populatedTxs.length === 0) {
      return
    }

    const fwtOpts = {
      token: authStore.state.accessToken!,
      client_id: import.meta.env.VITE_CLIENT_ID,
      evm_wss: import.meta.env.VITE_CREDENZA_EVM_WSS,
    }

    const signer = await (await import('@repo/fe-evm-provider')).getSigner()
    const provider = signer.provider

    if (!provider) {
      throw new Error('Provider is not initialized')
    }

    for (const tx of populatedTxs) {
      const hash = await this.forwardPriceTransaction(tx, fwtOpts)
      const receipt = await provider.waitForTransaction(hash, 1, TX_TIMEOUT)

      if (!receipt || receipt.status === 0) {
        throw new Error('Transaction failed')
      }
    }
  }

  private async forwardPriceTransaction(
    tx: ethers.ContractTransaction,
    fwtOpts: { token: string; client_id: string; evm_wss: string },
  ): Promise<string> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Forward transaction timed out')), TX_TIMEOUT)
    })

    try {
      return await Promise.race([forwardTransaction(tx, fwtOpts), timeout])
    } finally {
      clearTimeout(timer)
    }
  }

  async mintWithPrices(accessToken: string, prices: { oneTimePrice: number; lifetimePrice?: number }): Promise<string> {
    const userAddress = await this.blockchainService.getUserAddress()
    const mintPopulatedTx = await this.blockchainService.createMintTransaction(userAddress, prices)

    const txHash = await this.forwardMintTransaction(mintPopulatedTx)
    const tokenId = await this.extractTokenIdFromTransaction(txHash, accessToken)

    return String(tokenId)
  }

  private async forwardMintTransaction(mintPopulatedTx: ethers.ContractTransaction): Promise<string> {
    return await forwardTransaction(mintPopulatedTx, {
      token: authStore.state.accessToken!,
      client_id: import.meta.env.VITE_CLIENT_ID,
      evm_wss: import.meta.env.VITE_CREDENZA_EVM_WSS,
    })
  }

  private async extractTokenIdFromTransaction(txHash: string, accessToken: string): Promise<number> {
    const ethersProvider = await this.blockchainService.getEthersProvider(accessToken)
    const receipt = await ethersProvider.waitForTransaction(txHash)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (!receipt) {
      throw new Error('Transaction failed')
    }
    const signer = await (await import('@repo/fe-evm-provider')).getSigner()
    const contentContract = configStore.getContract(ContractName.CONTENT_NFT, signer)

    const transferEvent = this.blockchainService.parseTransferEvent(receipt, contentContract)
    const tokenId = Number(transferEvent?.args.tokenId)

    if (!tokenId) {
      throw new Error('Could not extract token ID from transaction')
    }

    return tokenId
  }
}
