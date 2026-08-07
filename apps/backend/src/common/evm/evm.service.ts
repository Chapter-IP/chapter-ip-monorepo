import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FallbackProvider, JsonRpcProvider } from 'ethers'

const RPC_STALL_TIMEOUT_MS = 1_000

export type TLazyMintEip712Domain = {
  name: string
  version: string
  chainId: number
  verifyingContract: string
}

export type TSignLazyMintTokenRequest = {
  domain: TLazyMintEip712Domain
  type: Record<string, Array<{ name: string; type: string }>>
  voucher: Record<string, unknown>
}

export type TSignLazyMintTokenResponse = {
  sig: string
  voucher: unknown
}

@Injectable()
export class CommonEvmService {
  private readonly provider: FallbackProvider

  constructor(private readonly configService: ConfigService) {
    const rpcUrls = this.configService.get<string[]>('evm.rpcUrl')
    if (!rpcUrls?.length) {
      throw new Error('Missing EVM_RPC_URL')
    }

    const providers = rpcUrls.map((url, index) => ({
      provider: new JsonRpcProvider(url),
      priority: index + 1,
      stallTimeout: RPC_STALL_TIMEOUT_MS,
      weight: 1,
    }))

    this.provider = new FallbackProvider(providers, undefined, { quorum: 1 })
  }

  public getProvider() {
    return this.provider
  }

  private getCredenzaEvmAuthHeaders(): Record<string, string> {
    const clientId = this.configService.get<string>('credenza.clientId')
    const clientSecret = this.configService.get<string>('credenza.clientSecret')
    return {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    }
  }

  public async getUserEvmAddressBySub(sub: string) {
    const evmUrl = this.configService.getOrThrow<string>('credenza.evmUrl')
    const result = await fetch(`${evmUrl}/accounts/${sub}/address`, {
      headers: this.getCredenzaEvmAuthHeaders(),
    })
    const json = (await result.json()) as { address: string }
    return json.address
  }

  public async getSubByEvmAddress(address: string): Promise<string> {
    const evmUrl = this.configService.getOrThrow<string>('credenza.evmUrl')
    const result = await fetch(`${evmUrl}/accounts/${address}/sub`, {
      headers: this.getCredenzaEvmAuthHeaders(),
    })
    const json = (await result.json()) as { sub: string }
    return json.sub
  }

  public async signLazyMintToken(body: TSignLazyMintTokenRequest): Promise<TSignLazyMintTokenResponse> {
    const evmUrl = this.configService.get<string>('credenza.evmUrl')
    if (!evmUrl) {
      throw new Error('Missing EVM_URL')
    }
    const result = await fetch(`${evmUrl}/contracts/lazy-mint/sign`, {
      method: 'POST',
      headers: this.getCredenzaEvmAuthHeaders(),
      body: JSON.stringify(body),
    })
    if (!result.ok) {
      const errorBody = await result.text()
      throw new Error(`Credenza EVM lazy-mint sign failed (${result.status}): ${errorBody}`)
    }
    return (await result.json()) as TSignLazyMintTokenResponse
  }
}
