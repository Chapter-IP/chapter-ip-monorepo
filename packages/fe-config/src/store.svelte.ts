import { ethers } from '@repo/fe-evm-provider'

import { abi as membership_abi } from '@credenza3/contracts/artifacts/ChapterIpMembershipContract.json'
import { abi as content_abi } from '@credenza3/contracts/artifacts/ContentNftContract.json'
import { abi as license_abi } from '@credenza3/contracts/artifacts/LicenseNftContract.json'
import type { ConfigResponse } from './types'

export enum ContractName {
  MEMBERSHIP = 'membership',
  CONTENT_NFT = 'contentNft',
  LICENSE_NFT = 'licenseNft',
}

const contractAbis: Record<ContractName, ethers.InterfaceAbi> = {
  [ContractName.MEMBERSHIP]: membership_abi,
  [ContractName.CONTENT_NFT]: content_abi,
  [ContractName.LICENSE_NFT]: license_abi,
}

function createConfigStore() {
  let data = $state<ConfigResponse | null>(null)

  function getContractAddress(contractName: ContractName) {
    const address = data?.contractAddresses[contractName]

    if (!address) {
      throw new Error(`${contractName} contract address not initialized`)
    }

    return address
  }

  function getContract(contractName: ContractName, runner: ethers.ContractRunner) {
    const address = getContractAddress(contractName)
    const abi = contractAbis[contractName]

    return new ethers.Contract(address, abi, runner)
  }

  function getMarketplaceUrl() {
    const env = data?.env
    if (env === 'prod') return 'https://marketplace.chapterip.com/'
    return 'https://marketplace-staging.chapterip.com/'
  }

  return {
    get state() {
      return data
    },

    set(config: ConfigResponse) {
      data = config
    },

    getContract,
    getContractAddress,
    getMarketplaceUrl,
  }
}

export const configStore = createConfigStore()
