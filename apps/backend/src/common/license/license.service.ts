import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Contract } from 'ethers'
import licenseNftContract from '@credenza3/contracts/artifacts/LicenseNftContract.json' with { type: 'json' }

import { CommonEvmService } from '../evm/evm.service.js'

import { BlockedLicenseService } from './blocked-license/blocked-license.service.js'

@Injectable()
export class CommonLicenseService {
  private readonly logger = new Logger(CommonLicenseService.name)
  private licenseNftContract!: Contract

  constructor(
    private readonly configService: ConfigService,
    private readonly commonEvmService: CommonEvmService,
    private readonly blockedLicenseService: BlockedLicenseService,
  ) {
    const provider = this.commonEvmService.getProvider()
    const licenceContractAddress = this.configService.get<string>('evm.licenseNftContractAddress')
    if (!licenceContractAddress) {
      throw new Error('Missing EVM_LICENSE_NTF_CONTRACT_ADDRESS')
    }
    this.licenseNftContract = new Contract(licenceContractAddress, licenseNftContract.abi, provider)
  }

  public getLicenseNftContract() {
    return this.licenseNftContract
  }

  public async verify(
    sub: string,
    subEvmAddress: string,
    contentTokenId: string,
    licenseTokenId: string,
  ): Promise<[false, string] | [true, null]> {
    try {
      subEvmAddress = subEvmAddress.toLowerCase()
      const licenseContentTokenId = (await this.licenseNftContract.getTokenLicenseContentNftId(
        licenseTokenId,
      )) as number
      if (String(licenseContentTokenId) !== contentTokenId) {
        return [false, 'Invalid license content token ID']
      }

      const licenseOwner = (await this.licenseNftContract.ownerOf(licenseTokenId)) as string
      if (licenseOwner.toLowerCase() !== subEvmAddress) {
        return [false, 'You are not the owner of this license']
      }

      const licenseType = Number(await this.licenseNftContract.getTokenLicenseType(licenseTokenId))
      switch (licenseType) {
        case 2: {
          const blockedLicenseModel = this.blockedLicenseService.getModel()
          const blocked = await blockedLicenseModel.findOne({ tokenId: licenseTokenId, subEvmAddress, sub })
          const oneTimeLinkActiveHours = this.configService.get<number>('license.oneTimeLinkActiveHours')!
          const oneTimeLinkActiveMs = oneTimeLinkActiveHours * 60 * 60 * 1000
          if (blocked) {
            if (Date.now() - blocked.createdAt.getTime() >= oneTimeLinkActiveMs) {
              return [false, 'License has been already used']
            }
          } else {
            await blockedLicenseModel.create({ tokenId: licenseTokenId, subEvmAddress, sub })
          }
          break
        }
        case 1: {
          const expiresAt = (await this.licenseNftContract.getTokenLicenseExpiresAt(licenseTokenId)) as number
          if (expiresAt < Date.now() / 1000) {
            return [false, 'License expired']
          }
          break
        }
        case 0: {
          break
        }
        default: {
          return [false, `Unsupported license type (${licenseType})`]
        }
      }

      return [true, null]
    } catch (err) {
      this.logger.error('License verify failed', err)
      return [false, 'Forbidden']
    }
  }
}
