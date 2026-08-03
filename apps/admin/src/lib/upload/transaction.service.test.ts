import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  forwardTransaction: vi.fn(),
  getSigner: vi.fn(),
}))

vi.mock('@repo/fe-services', () => ({
  forwardTransaction: mocks.forwardTransaction,
}))

vi.mock('@repo/fe-evm-provider', () => ({
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
  configStore: {},
  ContractName: {},
}))

import TransactionService from './transaction.service'

const createBlockchainService = () => ({
  createSetPricesTransaction: vi.fn().mockResolvedValue([{ data: '0x' }, { data: '0x' }]),
})

const createProvider = () => ({
  waitForTransaction: vi.fn().mockResolvedValue({ status: 1 }),
})

describe('TransactionService.updateContentPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    mocks.getSigner.mockResolvedValue({ provider: createProvider() })
    mocks.forwardTransaction.mockResolvedValue('0x-hash')
  })

  it('forwards price transactions sequentially and awaits each receipt', async () => {
    const blockchainService = createBlockchainService()
    const service = new TransactionService(blockchainService as never)

    await service.updateContentPrices('access-token', 'token-id', { oneTimePrice: 5, lifetimePrice: 10 })

    expect(blockchainService.createSetPricesTransaction).toHaveBeenCalledWith('token-id', {
      oneTimePrice: 5,
      lifetimePrice: 10,
    })
    expect(mocks.forwardTransaction).toHaveBeenCalledTimes(2)
  })

  it('skips when there are no transactions to forward', async () => {
    const blockchainService = {
      createSetPricesTransaction: vi.fn().mockResolvedValue([]),
    }
    const service = new TransactionService(blockchainService as never)

    await service.updateContentPrices('access-token', 'token-id', { oneTimePrice: 0 })

    expect(mocks.forwardTransaction).not.toHaveBeenCalled()
    expect(mocks.getSigner).not.toHaveBeenCalled()
  })

  it('throws when a receipt status is zero', async () => {
    const provider = { waitForTransaction: vi.fn().mockResolvedValue({ status: 0 }) }
    mocks.getSigner.mockResolvedValue({ provider })

    const service = new TransactionService(createBlockchainService() as never)

    await expect(service.updateContentPrices('access-token', 'token-id', { oneTimePrice: 5 })).rejects.toThrow(
      'Transaction failed',
    )
  })

  it('throws when the provider is missing', async () => {
    mocks.getSigner.mockResolvedValue({})

    const service = new TransactionService(createBlockchainService() as never)

    await expect(service.updateContentPrices('access-token', 'token-id', { oneTimePrice: 5 })).rejects.toThrow(
      'Provider is not initialized',
    )
  })

  it('rejects when forwarding a transaction times out', async () => {
    vi.useFakeTimers()
    mocks.forwardTransaction.mockReturnValue(new Promise(() => {}))

    const blockchainService = {
      createSetPricesTransaction: vi.fn().mockResolvedValue([{ data: '0x' }]),
    }
    const service = new TransactionService(blockchainService as never)

    const promise = service.updateContentPrices('access-token', 'token-id', { oneTimePrice: 5 })
    const assertion = expect(promise).rejects.toThrow('Forward transaction timed out')

    await vi.advanceTimersByTimeAsync(90_000)

    await assertion
  })
})
