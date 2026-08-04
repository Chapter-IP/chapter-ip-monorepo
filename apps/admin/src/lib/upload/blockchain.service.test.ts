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
  getLicensePriceFiat: vi.fn(),
  getLicensePriceToken: vi.fn(),
  setLicensePriceFiat: {
    populateTransaction: vi.fn().mockResolvedValue({ data: '0x' }),
  },
  setLicensePriceToken: {
    populateTransaction: vi.fn().mockResolvedValue({ data: '0x' }),
  },
})

const mockOnChainPrices = (prices: Record<number, { fiat: number; token: number }>) => {
  const contract = mocks.getContract()
  contract.getLicensePriceFiat.mockImplementation((_tokenId: string, licenseType: number) =>
    Promise.resolve(prices[licenseType].fiat),
  )
  contract.getLicensePriceToken.mockImplementation((_tokenId: string, licenseType: number) =>
    Promise.resolve(prices[licenseType].token),
  )
}

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
    expect(mocks.getContract().getLicensePriceFiat).not.toHaveBeenCalled()
  })

  it('skips forwarding when the on-chain prices already match', async () => {
    mockOnChainPrices({
      [2]: { fiat: 500, token: 5_000_000 },
      [0]: { fiat: 1000, token: 10_000_000 },
    })

    const service = new BlockchainService('access-token')

    await service.updateContentPrices('token-id', { oneTimePrice: 5, lifetimePrice: 10 })

    expect(mocks.forwardTransaction).not.toHaveBeenCalled()
    expect(mocks.getContract().setLicensePriceFiat.populateTransaction).not.toHaveBeenCalled()
    expect(mocks.getContract().setLicensePriceToken.populateTransaction).not.toHaveBeenCalled()
  })

  it('updates only the license types whose price changed', async () => {
    mockOnChainPrices({
      [2]: { fiat: 500, token: 5_000_000 },
      [0]: { fiat: 0, token: 0 },
    })

    const service = new BlockchainService('access-token')

    await service.updateContentPrices('token-id', { oneTimePrice: 5, lifetimePrice: 10 })

    expect(mocks.getContract().setLicensePriceFiat.populateTransaction).toHaveBeenCalledTimes(1)
    expect(mocks.getContract().setLicensePriceToken.populateTransaction).toHaveBeenCalledTimes(1)
    expect(mocks.getContract().setLicensePriceFiat.populateTransaction).toHaveBeenCalledWith('token-id', 0, 1000)
    expect(mocks.getContract().setLicensePriceToken.populateTransaction).toHaveBeenCalledWith('token-id', 0, 10_000_000)
    expect(mocks.forwardTransaction).toHaveBeenCalledTimes(2)
  })

  it('writes the price when reading the on-chain price fails', async () => {
    const contract = mocks.getContract()
    contract.getLicensePriceFiat.mockRejectedValue(new Error('read failed'))
    contract.getLicensePriceToken.mockRejectedValue(new Error('read failed'))

    const service = new BlockchainService('access-token')

    await service.updateContentPrices('token-id', { oneTimePrice: 5 })

    expect(mocks.getContract().setLicensePriceFiat.populateTransaction).toHaveBeenCalledWith('token-id', 2, 500)
    expect(mocks.getContract().setLicensePriceToken.populateTransaction).toHaveBeenCalledWith('token-id', 2, 5_000_000)
    expect(mocks.forwardTransaction).toHaveBeenCalledTimes(2)
  })

  it('throws when a receipt status is zero', async () => {
    mockOnChainPrices({ [2]: { fiat: 0, token: 0 } })
    const provider = { waitForTransaction: vi.fn().mockResolvedValue({ status: 0 }) }
    mocks.getSigner.mockResolvedValue({ provider })

    const service = new BlockchainService('access-token')

    await expect(service.updateContentPrices('token-id', { oneTimePrice: 5 })).rejects.toThrow('Transaction failed')
  })

  it('throws when the provider is missing', async () => {
    mockOnChainPrices({ [2]: { fiat: 0, token: 0 } })
    mocks.getSigner.mockResolvedValue({})

    const service = new BlockchainService('access-token')

    await expect(service.updateContentPrices('token-id', { oneTimePrice: 5 })).rejects.toThrow(
      'Provider is not initialized',
    )
  })

  it('rejects when forwarding a transaction times out', async () => {
    vi.useFakeTimers()
    mockOnChainPrices({ [2]: { fiat: 0, token: 0 } })
    mocks.forwardTransaction.mockReturnValue(new Promise(() => {}))

    const service = new BlockchainService('access-token')

    const promise = service.updateContentPrices('token-id', { oneTimePrice: 5 })
    const assertion = expect(promise).rejects.toThrow('Forward transaction timed out')

    await vi.advanceTimersByTimeAsync(90_000)

    await assertion
  })
})
