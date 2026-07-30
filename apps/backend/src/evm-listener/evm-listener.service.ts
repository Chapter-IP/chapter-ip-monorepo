import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Contract, EventLog, EventFragment, Interface, InterfaceAbi, Log, WebSocketProvider } from 'ethers'
import { abi as contentAbi } from '@credenza3/contracts/artifacts/ContentNftContract.json'
import { abi as licenseAbi } from '@credenza3/contracts/artifacts/LicenseNftContract.json'

import { EvmEventService } from './evm-event.service'

const RECONNECT_BASE_DELAY_MS = 2_000
const RECONNECT_MAX_DELAY_MS = 30_000
const MONGO_DUPLICATE_KEY_CODE = 11000

interface SocketEmitter {
  on(event: 'open' | 'close' | 'error', listener: (...args: unknown[]) => void): unknown
}

interface ListenerContractConfig {
  address: string
  abi: InterfaceAbi
}

@Injectable()
export class EvmListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvmListenerService.name)
  private readonly listenerContractConfigs: ListenerContractConfig[] = []
  private readonly contractInterfacesByAddress = new Map<string, Interface>()
  private readonly eventFragmentByTopic = new Map<string, EventFragment>()

  private provider: WebSocketProvider | null = null
  private contracts: Contract[] = []

  private wsUrls: readonly string[] = []
  private currentUrlIndex = 0

  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private isStopped = false

  constructor(
    private readonly configService: ConfigService,
    private readonly evmEventService: EvmEventService,
  ) {}

  async onModuleInit() {
    this.wsUrls = this.configService.get<string[]>('evm.wsUrls')!
    if (!this.wsUrls.length) {
      this.logger.warn('No EVM websocket URLs configured')
      return
    }
    this.initializeContractsAndEventTopics()
    await this.connect()
  }

  async onModuleDestroy() {
    this.isStopped = true
    this.cancelReconnect()
    await this.disconnect()
    this.logger.log('Stopped EVM websocket listener')
  }

  private async connect() {
    if (this.isStopped) {
      return
    }

    const url = this.currentUrl()
    const contractsToListen = this.listenerContractConfigs

    this.logger.log(`Connecting to ${url}`)

    try {
      const provider = new WebSocketProvider(url)
      this.provider = provider
      this.attachSocketLifecycle(provider, url)

      this.contracts = contractsToListen.map(({ address, abi }) => {
        const contract = new Contract(address, abi, provider)
        contract
          .on('*', (...args: unknown[]) => void this.handleEvent(args))
          .catch((error: unknown) => {
            this.logger.error(`Subscription to ${address} via ${url} failed: ${this.formatError(error)}`)
            this.handleSubscriptionFailure(provider, `unsupported subscription on ${url}`)
          })
        return contract
      })

      this.reconnectAttempts = 0
      this.logger.log(
        `Listening for events on [${contractsToListen.map(({ address }) => address).join(', ')}] via ${url}`,
      )
    } catch (error) {
      this.logger.error(`Connection to ${url} failed: ${this.formatError(error)}`)
      await this.disconnect()
      this.advanceUrl()
      this.scheduleReconnect(`init failure on ${url}`)
    }
  }

  private async disconnect() {
    this.contracts.forEach((contract) => void contract.removeAllListeners().catch((e: unknown) => this.logger.error(e)))
    this.contracts = []

    const provider = this.provider
    this.provider = null

    if (!provider) {
      return
    }

    try {
      await provider.destroy()
    } catch (error) {
      this.logger.warn(`Provider destroy error: ${this.formatError(error)}`)
    }
  }

  private attachSocketLifecycle(provider: WebSocketProvider, url: string) {
    const socket = this.getSocketEmitter(provider)
    if (!socket) {
      this.logger.warn(`Cannot bind WS lifecycle handlers for ${url}`)
      return
    }

    socket.on('open', () => this.logger.log(`WS open: ${url}`))

    socket.on('error', (error: unknown) => {
      this.logger.error(`WS error on ${url}: ${this.formatError(error)}`)
      this.handleSocketDeath(`error on ${url}`)
    })

    socket.on('close', (code: unknown) => {
      this.logger.warn(`WS closed on ${url} (code=${String(code)})`)
      this.handleSocketDeath(`close on ${url}`)
    })
  }

  private handleSocketDeath(reason: string) {
    if (this.isStopped || this.reconnectTimer || !this.provider) {
      return
    }

    void this.recover(reason)
  }

  private handleSubscriptionFailure(provider: WebSocketProvider, reason: string) {
    if (this.isStopped || this.reconnectTimer || this.provider !== provider) {
      return
    }

    this.logger.warn(`Falling back to next provider due to: ${reason}`)
    void this.recover(reason)
  }

  private async recover(reason: string) {
    await this.disconnect()
    this.advanceUrl()
    this.scheduleReconnect(reason)
  }

  private scheduleReconnect(reason: string) {
    if (this.isStopped || this.reconnectTimer) {
      return
    }

    const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempts, RECONNECT_MAX_DELAY_MS)
    this.reconnectAttempts += 1
    this.logger.warn(`Reconnect scheduled in ${delay}ms (${reason})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect()
    }, delay)
  }

  private cancelReconnect() {
    if (!this.reconnectTimer) {
      return
    }
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private async handleEvent(args: unknown[]) {
    const eventLog = this.findEventLog(args)
    if (!eventLog) {
      this.logger.warn('Received event without parsable EventLog')
      return
    }

    try {
      await this.evmEventService.getModel().create({
        contractAddress: eventLog.address.toLowerCase(),
        eventName: eventLog.fragment.name,
        blockNumber: eventLog.blockNumber,
        transactionHash: eventLog.transactionHash,
        logIndex: eventLog.index,
        args: this.normalize(eventLog.args.toArray()),
        raw: this.normalize({
          topics: eventLog.topics,
          data: eventLog.data,
          transactionIndex: eventLog.transactionIndex,
          blockHash: eventLog.blockHash,
          removed: eventLog.removed,
        }),
      })

      this.logger.log(`Stored event "${eventLog.fragment.name}" tx=${eventLog.transactionHash} index=${eventLog.index}`)
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        this.logger.debug(`Skipped duplicate event tx=${eventLog.transactionHash} index=${eventLog.index}`)
        return
      }
      this.logger.error(
        `Failed to persist event tx=${eventLog.transactionHash} index=${eventLog.index}: ${this.formatError(error)}`,
      )
    }
  }

  private currentUrl() {
    return this.wsUrls[this.currentUrlIndex % this.wsUrls.length]
  }

  private advanceUrl() {
    this.currentUrlIndex = (this.currentUrlIndex + 1) % this.wsUrls.length
  }

  private requireEnv(name: string) {
    const value = this.configService.get<string>(name)
    if (!value) {
      throw new Error(`Missing ${name}`)
    }
    return value
  }

  private getContractsToListen(): ListenerContractConfig[] {
    const contentNft = this.requireEnv('evm.contentNftContractAddress')
    const licenseNft = this.requireEnv('evm.licenseNftContractAddress')

    return [
      { address: contentNft, abi: contentAbi },
      { address: licenseNft, abi: licenseAbi },
    ]
  }

  private initializeContractsAndEventTopics() {
    this.listenerContractConfigs.length = 0
    this.listenerContractConfigs.push(...this.getContractsToListen())
    this.contractInterfacesByAddress.clear()
    this.eventFragmentByTopic.clear()

    for (const contractConfig of this.listenerContractConfigs) {
      const contractInterface = new Interface(contractConfig.abi)
      this.contractInterfacesByAddress.set(contractConfig.address.toLowerCase(), contractInterface)

      for (const fragment of contractInterface.fragments) {
        if (fragment.type !== 'event') {
          continue
        }
        const eventFragment = EventFragment.from(fragment)
        this.eventFragmentByTopic.set(eventFragment.topicHash, eventFragment)
      }
    }
  }

  private getSocketEmitter(provider: WebSocketProvider): SocketEmitter | null {
    const ws = (provider as unknown as { websocket?: unknown }).websocket
    if (!ws || typeof ws !== 'object') {
      return null
    }
    const candidate = ws as { on?: unknown }
    return typeof candidate.on === 'function' ? (ws as SocketEmitter) : null
  }

  private findEventLog(args: unknown[]): EventLog | null {
    const candidates = [args[args.length - 1], ...args]
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') {
        continue
      }

      const maybeLog = (candidate as Record<string, unknown>)['log']
      if (this.isEventLog(maybeLog)) {
        return maybeLog
      }

      const rawLog = this.extractLog(candidate)
      if (!rawLog) {
        continue
      }

      const parsed = this.parseRawLog(rawLog)
      if (parsed) {
        return parsed
      }
    }
    return null
  }

  private isEventLog(value: unknown): value is EventLog {
    return (
      value !== null &&
      typeof value === 'object' &&
      'fragment' in value &&
      'transactionHash' in value &&
      'blockNumber' in value &&
      'args' in value
    )
  }

  private extractLog(value: unknown): Log | null {
    if (!value || typeof value !== 'object') {
      return null
    }
    if (this.isLog(value)) {
      return value
    }
    const maybeLog = (value as Record<string, unknown>)['log']
    return this.isLog(maybeLog) ? maybeLog : null
  }

  private isLog(value: unknown): value is Log {
    return (
      value !== null &&
      typeof value === 'object' &&
      'address' in value &&
      'topics' in value &&
      'data' in value &&
      'transactionHash' in value &&
      'blockNumber' in value
    )
  }

  private parseRawLog(log: Log): EventLog | null {
    const topic = log.topics[0]
    if (!topic || !this.eventFragmentByTopic.has(topic)) {
      return null
    }

    const contractInterface = this.contractInterfacesByAddress.get(log.address.toLowerCase())
    if (!contractInterface) {
      return null
    }

    const parsedLog = contractInterface.parseLog(log)
    if (!parsedLog) {
      return null
    }

    return new EventLog(log, contractInterface, parsedLog.fragment)
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as Record<string, unknown>)['code'] === MONGO_DUPLICATE_KEY_CODE
    )
  }

  private normalize(value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.normalize(item))
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, this.normalize(nested)]),
      )
    }
    return value
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.stack ?? error.message
    }
    return String(error)
  }
}
