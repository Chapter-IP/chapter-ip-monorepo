import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  forwardTransaction: vi.fn(),
  initProvider: vi.fn(),
  getSigner: vi.fn(),
  getContract: vi.fn(),
}))

vi.mock('@repo/fe-services', () => ({
  forwardTransaction: mocks.forwardTransaction,
}))

vi.mock('@repo/fe-evm-provider', () => ({
  initProvider: mocks.initProvider,
  getSigner: mocks.getSigner,
  ethers: {},
}))

vi.mock('$lib', () => ({
  authStore: {
    state: {
      accessToken: 'access-token',
    },
  },
}))

vi.mock('$lib/stores/config.svelte', () => ({
  configStore: {
    getContract: mocks.getContract,
  },
  ContractName: {},
}))

import BlockchainService from './blockchain.service'

const createProvider = () => ({
  waitForTransaction: vi.fn().mockResolvedValue({ status: 1 }),
})

const createContentContract = () => ({
  setLicensePriceFiat: {
    populateTransaction: vi.fn().mockResolvedValue({ data: '0x' }),
  },
  setLicensePriceToken: {
    populateTransaction: vi.fn().mockResolvedValue({ data: '0x' }),
  },
})

describe('BlockchainService.updateContentPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    mocks.initProvider.mockResolvedValue({})
    mocks.getContract.mockReturnValue(createContentContract())
    mocks.getSigner.mockResolvedValue({ provider: createProvider() })
    mocks.forwardTransaction.mockResolvedValue('0x-hash')
  })

  it('forwards price transactions sequentially and awaits each receipt', async () => {
    const service = new BlockchainService('access-token')

    await service.updateContentPrices('token-id', { oneTimePrice: 5, lifetimePrice: 10 })

    expect(mocks.getContract().setLicensePriceFiat.populateTransaction).toHaveBeenCalledTimes(2)
    expect(mocks.getContract().setLicensePriceToken.populateTransaction).toHaveBeenCalledTimes(2)
    expect(mocks.forwardTransaction).toHaveBeenCalledTimes(4)
  })

  it('skips when there are no transactions to forward', async () => {
    const service = new BlockchainService('access-token')

    await service.updateContentPrices('token-id', { oneTimePrice: 0 })

    expect(mocks.forwardTransaction).not.toHaveBeenCalled()
    expect(mocks.getContract().setLicensePriceFiat.populateTransaction).not.toHaveBeenCalled()
  })

  it('throws when a receipt status is zero', async () => {
    const provider = { waitForTransaction: vi.fn().mockResolvedValue({ status: 0 }) }
    mocks.getSigner.mockResolvedValue({ provider })

    const service = new BlockchainService('access-token')

    await expect(service.updateContentPrices('token-id', { oneTimePrice: 5 })).rejects.toThrow('Transaction failed')
  })

  it('throws when the provider is missing', async () => {
    mocks.getSigner.mockResolvedValue({})

    const service = new BlockchainService('access-token')

    await expect(service.updateContentPrices('token-id', { oneTimePrice: 5 })).rejects.toThrow(
      'Provider is not initialized',
    )
  })

  it('rejects when forwarding a transaction times out', async () => {
    vi.useFakeTimers()
    mocks.forwardTransaction.mockReturnValue(new Promise(() => {}))

    const service = new BlockchainService('access-token')

    const promise = service.updateContentPrices('token-id', { oneTimePrice: 5 })
    const assertion = expect(promise).rejects.toThrow('Forward transaction timed out')

    await vi.advanceTimersByTimeAsync(90_000)

    await assertion
  })
})
