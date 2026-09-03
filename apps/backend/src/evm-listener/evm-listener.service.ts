import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { EventLog, EventFragment, Interface, InterfaceAbi, Log } from 'ethers'
import { Model } from 'mongoose'
import contentNftContract from '@credenza3/contracts/artifacts/ContentNftContract.json' with { type: 'json' }
import licenseNftContract from '@credenza3/contracts/artifacts/LicenseNftContract.json' with { type: 'json' }

import { CommonEvmService } from '../common/evm/evm.service.js'

import { EvmEventService } from './evm-event.service.js'
import { EvmSyncStateModelName, type EvmSyncState } from './evm-sync-state.schema.js'

const POLL_INTERVAL_MS = 10_000
const RETRY_BASE_DELAY_MS = 2_000
const RETRY_MAX_DELAY_MS = 30_000
const BLOCK_BATCH_SIZE = 2_000
const CONFIRMATION_BLOCKS = 2
const SYNC_STATE_NAME = 'evm-event-listener'
const MONGO_DUPLICATE_KEY_CODE = 11000

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

  private pollTimer: NodeJS.Timeout | null = null
  private lastProcessedBlock: number | null = null
  private retryAttempts = 0
  private isStopped = false

  constructor(
    private readonly configService: ConfigService,
    private readonly evmEventService: EvmEventService,
    private readonly commonEvmService: CommonEvmService,
    @InjectModel(EvmSyncStateModelName) private readonly syncStateModel: Model<EvmSyncState>,
  ) {}

  async onModuleInit() {
    this.initializeContractsAndEventTopics()
    await this.poll()
  }

  onModuleDestroy() {
    this.isStopped = true
    this.cancelPoll()
    this.logger.log('Stopped EVM event poller')
  }

  private async poll() {
    if (this.isStopped) {
      return
    }

    let nextDelay = POLL_INTERVAL_MS

    try {
      nextDelay = await this.pollNextBlockRange()
      this.retryAttempts = 0
    } catch (error) {
      nextDelay = Math.min(RETRY_BASE_DELAY_MS * 2 ** this.retryAttempts, RETRY_MAX_DELAY_MS)
      this.retryAttempts += 1
      this.logger.error(`EVM polling failed; retrying in ${nextDelay}ms: ${this.formatError(error)}`)
    } finally {
      this.schedulePoll(nextDelay)
    }
  }

  private async pollNextBlockRange(): Promise<number> {
    const provider = this.commonEvmService.getProvider()
    const latestBlock = await provider.getBlockNumber()
    const safeLatestBlock = Math.max(0, latestBlock - CONFIRMATION_BLOCKS)

    if (this.lastProcessedBlock === null) {
      const state = await this.syncStateModel.findOne({ name: SYNC_STATE_NAME }).lean().exec()
      this.lastProcessedBlock = state?.lastProcessedBlock ?? safeLatestBlock

      if (!state) {
        await this.saveCheckpoint(this.lastProcessedBlock)
        this.logger.log(`Initialized EVM polling checkpoint at block ${this.lastProcessedBlock}`)
      } else {
        this.logger.log(`Resumed EVM polling from block ${this.lastProcessedBlock + 1}`)
      }
    }

    if (this.lastProcessedBlock >= safeLatestBlock) {
      return POLL_INTERVAL_MS
    }

    const fromBlock = this.lastProcessedBlock + 1
    const toBlock = Math.min(fromBlock + BLOCK_BATCH_SIZE - 1, safeLatestBlock)
    const logs = await provider.getLogs({
      address: this.listenerContractConfigs.map(({ address }) => address),
      fromBlock,
      toBlock,
    })

    logs.sort((left, right) => left.blockNumber - right.blockNumber || left.index - right.index)
    for (const log of logs) {
      await this.handleEvent(log)
    }

    await this.saveCheckpoint(toBlock)
    this.lastProcessedBlock = toBlock
    if (logs.length > 0) {
      this.logger.debug(`Processed EVM blocks ${fromBlock}-${toBlock} (${logs.length} logs)`)
    }

    return toBlock < safeLatestBlock ? 0 : POLL_INTERVAL_MS
  }

  private async saveCheckpoint(blockNumber: number) {
    await this.syncStateModel
      .updateOne(
        { name: SYNC_STATE_NAME },
        { $max: { lastProcessedBlock: blockNumber }, $setOnInsert: { name: SYNC_STATE_NAME } },
        { upsert: true },
      )
      .exec()
  }

  private schedulePoll(delay: number) {
    if (this.isStopped || this.pollTimer) {
      return
    }

    this.pollTimer = setTimeout(() => {
      this.pollTimer = null
      void this.poll()
    }, delay)
  }

  private cancelPoll() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
  }

  private async handleEvent(log: Log) {
    const eventLog = this.parseRawLog(log)
    if (!eventLog) {
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
      throw error
    }
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
      { address: contentNft, abi: contentNftContract.abi },
      { address: licenseNft, abi: licenseNftContract.abi },
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
