import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Contract } from 'ethers'
import contentNftContract from '@credenza3/contracts/artifacts/ContentNftContract.json' with { type: 'json' }
import chapterIpMembershipContract from '@credenza3/contracts/artifacts/ChapterIpMembershipContract.json' with { type: 'json' }
import { CommonEvmService } from '#backend/common/evm/evm.service.js'
import { CommonLicenseService } from '#backend/common/license/license.service.js'
import { ContentModelService } from './content-model.service.js'
import { FileService } from './file/file.service.js'
import { EvmEventService } from '#backend/evm-listener/evm-event.service.js'
import type { TGetContentStatisticOutput } from './content.dto.js'

const CONTENT_NFT_VOUCHER_EIP712_TYPE: Record<string, Array<{ name: string; type: string }>> = {
  ContentNFTVoucher: [
    { name: 'nonce', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'priceToken', type: 'uint256' },
    { name: 'licenseInfo', type: 'string' },
    { name: 'uri', type: 'string' },
  ],
}

@Injectable()
export class ContentService {
  private contentNftContract!: Contract
  private membershipContract!: Contract
  private licenseContractAddress!: string

  constructor(
    private readonly configService: ConfigService,
    private readonly commonEvmService: CommonEvmService,
    private readonly commonLicenseService: CommonLicenseService,
    private readonly contentService: ContentModelService,
    private readonly fileService: FileService,
    private readonly evmEventService: EvmEventService,
  ) {
    const provider = this.commonEvmService.getProvider()
    const contentContractAddress = this.configService.get<string>('evm.contentNftContractAddress')
    if (!contentContractAddress) {
      throw new Error('Missing EVM_CONTENT_NFT_CONTRACT_ADDRESS')
    }
    this.contentNftContract = new Contract(contentContractAddress, contentNftContract.abi, provider)
    const membershipContractAddress = this.configService.get<string>('evm.membershipContractAddress')
    if (membershipContractAddress) {
      this.membershipContract = new Contract(membershipContractAddress, chapterIpMembershipContract.abi, provider)
    }
    const licenseContractAddress = this.configService.get<string>('evm.licenseNftContractAddress')
    if (!licenseContractAddress) {
      throw new Error('Missing EVM_LICENSE_NFT_CONTRACT_ADDRESS')
    }
    this.licenseContractAddress = licenseContractAddress.toLowerCase()
  }

  public getContentNftContract() {
    return this.contentNftContract
  }

  public async getContentNftContractAddress() {
    return (await this.getContentNftContract().getAddress()).toLowerCase()
  }

  public async verifyIsOwner(subEvmAddress: string, contentTokenId: string): Promise<[false, string] | [true, null]> {
    try {
      const ownerEvmAddress = (await this.contentNftContract.ownerOf(contentTokenId)) as string
      if (ownerEvmAddress.toLowerCase() !== subEvmAddress.toLowerCase()) {
        return [false, `${subEvmAddress} is not the owner of ${contentTokenId} token ID`]
      }
      return [true, null]
    } catch {
      return [false, 'Forbidden']
    }
  }

  public async verifyIsOwnerById(sub: string, contentId: string): Promise<[false, string] | [true, null]> {
    try {
      const content = await this.contentService.findById(contentId)
      if (!content) {
        return [false, 'Content is not found']
      }

      if (content.tokenId) {
        const subEvmAddress = await this.commonEvmService.getUserEvmAddressBySub(sub)
        return this.verifyIsOwner(subEvmAddress, content.tokenId)
      }

      if (content.sub !== sub) {
        return [false, 'Forbidden']
      }

      return [true, null]
    } catch {
      return [false, 'Forbidden']
    }
  }

  public async removeContent(contentId: string): Promise<{ ok: true }> {
    const files = await this.fileService.find({ contentId })
    const keysByBucket = new Map<string, string[]>()
    for (const file of files) {
      const keys = keysByBucket.get(file.bucket) ?? []
      keys.push(file.key)
      keysByBucket.set(file.bucket, keys)
    }
    for (const [bucket, keys] of keysByBucket) {
      await this.fileService.removeObjects({
        Bucket: bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      })
    }
    await this.fileService.deleteMany({ contentId })
    await this.contentService.deleteOne({ _id: contentId })
    return { ok: true }
  }

  public async removeContentFile(file: { bucket: string; key: string; _id: unknown }): Promise<{ ok: true }> {
    await this.fileService.removeObject({
      Bucket: file.bucket,
      Key: file.key,
    })
    await this.fileService.deleteOne({ _id: file._id })
    return { ok: true }
  }

  public async getOwner(contentTokenId: string): Promise<string> {
    return (await this.contentNftContract.ownerOf(contentTokenId)) as string
  }
  public async verifyHasSubscription(publisherAddress: string, subEvmAddress: string): Promise<boolean> {
    if (!this.membershipContract) {
      return false
    }
    const res = (await this.membershipContract.confirmMembership(publisherAddress, subEvmAddress)) as boolean
    return res
  }

  public async verifyContentFileAccess(
    sub: string,
    contentId: string,
    licenseTokenId?: string,
  ): Promise<[false, string] | [true, null]> {
    const parent = await this.contentService.findById(contentId)
    if (!parent) {
      return [false, 'Content is not found']
    }

    const subEvmAddress = await this.commonEvmService.getUserEvmAddressBySub(sub)

    let hasMembership = false
    if (parent.tokenId) {
      const publisherAddress = await this.getOwner(parent.tokenId)
      hasMembership = await this.verifyHasSubscription(publisherAddress, subEvmAddress)
    }

    if (hasMembership) {
      return [true, null]
    }

    if (parent.tokenId) {
      if (licenseTokenId) {
        return this.commonLicenseService.verify(sub, subEvmAddress, parent.tokenId, licenseTokenId)
      }
      return this.verifyIsOwner(subEvmAddress, parent.tokenId)
    }

    return this.verifyIsOwnerById(sub, contentId)
  }

  public async requestLazyMintContentTokenVoucher(uri: string, licenseType: 0 | 2) {
    const eip712Domain = (await this.contentNftContract.eip712Domain()) as [
      string,
      string,
      string,
      bigint,
      string,
      string,
      bigint[],
    ]
    const verifyingContract = await this.getContentNftContractAddress()
    const nowMs = BigInt(Date.now())
    const randomPart = BigInt(Math.floor(Math.random() * 1_000_000))
    const nonce = (nowMs * 1_000_000n + randomPart).toString()

    const domain = {
      name: eip712Domain[1],
      version: eip712Domain[2],
      chainId: Number(eip712Domain[3]),
      verifyingContract,
    }

    const voucher = {
      nonce,
      price: '0',
      priceToken: '0',
      licenseInfo: String(licenseType),
      uri,
    }

    const { sig } = await this.commonEvmService.signLazyMintToken({
      domain,
      type: CONTENT_NFT_VOUCHER_EIP712_TYPE,
      voucher,
    })

    return { sig, domain, voucher }
  }

  public async getContentStatistic(tokenId: string): Promise<TGetContentStatisticOutput> {
    const [aggregationResult] = await this.evmEventService.getModel().aggregate<{
      tokenId: string
      boughtLicensesAmount: number
      revenueFiat: string
      revenueEth: string
      revenueToken: string
    }>([
      {
        $match: {
          contractAddress: this.licenseContractAddress,
          eventName: 'LicenseBought',
          'args.1': tokenId,
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                boughtLicensesAmount: { $sum: 1 },
                revenueFiat: { $sum: { $toDecimal: { $ifNull: [{ $arrayElemAt: ['$args', 3] }, '0'] } } },
                revenueEth: { $sum: { $toDecimal: { $ifNull: [{ $arrayElemAt: ['$args', 4] }, '0'] } } },
                revenueToken: { $sum: { $toDecimal: { $ifNull: [{ $arrayElemAt: ['$args', 5] }, '0'] } } },
              },
            },
          ],
        },
      },
      {
        $project: {
          tokenId: tokenId,
          totals: {
            $ifNull: [
              { $arrayElemAt: ['$totals', 0] },
              {
                boughtLicensesAmount: 0,
                revenueFiat: { $toDecimal: '0' },
                revenueEth: { $toDecimal: '0' },
                revenueToken: { $toDecimal: '0' },
              },
            ],
          },
        },
      },
      {
        $project: {
          tokenId: 1,
          boughtLicensesAmount: '$totals.boughtLicensesAmount',
          revenueFiat: { $toString: '$totals.revenueFiat' },
          revenueEth: { $toString: '$totals.revenueEth' },
          revenueToken: { $toString: '$totals.revenueToken' },
        },
      },
    ])

    return {
      tokenId,
      boughtLicensesAmount: aggregationResult?.boughtLicensesAmount ?? 0,
      revenue: {
        fiat: aggregationResult?.revenueFiat ?? '0',
        eth: aggregationResult?.revenueEth ?? '0',
        token: aggregationResult?.revenueToken ?? '0',
      },
    }
  }
}
