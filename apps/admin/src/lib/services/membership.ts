import { ethers, initProvider, getSigner } from '@repo/fe-evm-provider'
import { forwardTransaction } from '@repo/fe-services'
import { FIAT_PRICE_MULTIPLIER, TOKEN_PRICE_MULTIPLIER } from '@repo/content-types/content'
import { authStore } from '$lib/auth'
import { configStore, ContractName } from '$lib/stores/config.svelte'
import { publisherStore } from '$lib/stores/publisher.svelte'

export async function saveSubscriptionPrice(price: number): Promise<void> {
  if (price <= 0) {
    throw new Error('Subscription price must be greater than 0')
  }

  if (!publisherStore.evmAddress) {
    throw new Error('Publisher EVM address not found')
  }

  await initProvider(authStore.state.accessToken!)

  const signer = await getSigner()
  const contract = configStore.getContract(ContractName.MEMBERSHIP, signer)
  const tokenId = BigInt(ethers.getAddress(publisherStore.evmAddress))

  const [setPriceFiatTx, setPriceTokenTx] = await Promise.all([
    contract.setPriceFiat.populateTransaction(tokenId, Math.round(price * FIAT_PRICE_MULTIPLIER)),
    contract.setPriceToken.populateTransaction(tokenId, Math.round(price * TOKEN_PRICE_MULTIPLIER)),
  ])

  const fwtOpts = {
    token: authStore.state.accessToken!,
    client_id: import.meta.env.VITE_CLIENT_ID,
    evm_wss: import.meta.env.VITE_CREDENZA_EVM_WSS,
  }

  const ethersProvider = signer.provider
  const [fiatHash, tokenHash] = await Promise.all([
    forwardTransaction(setPriceFiatTx, fwtOpts),
    forwardTransaction(setPriceTokenTx, fwtOpts),
  ])

  const [fiatReceipt, tokenReceipt] = await Promise.all([
    ethersProvider?.waitForTransaction(fiatHash),
    ethersProvider?.waitForTransaction(tokenHash),
  ])

  if (!fiatReceipt || !tokenReceipt) {
    throw new Error('Transaction failed')
  }

  if (fiatReceipt.status === 0 || tokenReceipt.status === 0) {
    throw new Error('Transaction reverted')
  }
}
