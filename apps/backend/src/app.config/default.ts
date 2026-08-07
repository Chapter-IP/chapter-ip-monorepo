import { withEnvOverrides } from '../common/utils/utils'

export const ENV = {
  LOCAL: 'local',
  STAGING: 'staging',
  PROD: 'prod',
} as const

export function getEnv(): string {
  return process.env.NODE_ENV || ENV.LOCAL
}

const config = {
  env: getEnv(),
  port: 8060,
  mongo: {
    uri: 'mongodb://localhost:27017/chapter_ip_local?replicaSet=rs0',
  },
  credenza: {
    clientId: '66a36001a7152aa7d6f9e135',
    clientSecret: '',
    accountsUrl: 'https://accounts.staging.credenza3.com',
    evmUrl: 'https://evm.staging.credenza3.com',
  },
  evm: {
    rpcUrl: ['https://api.avax-test.network/ext/bc/C/rpc'],
    contentNftContractAddress: '0xC748855724179Ab0c0Fb5d196f2926A152AAea5c',
    licenseNftContractAddress: '0xBF2268a14D7f2024EFcf1f4cb2F8ab9f8AE5b6d6',
    membershipContractAddress: '0xCbE52ed30E0841429262d5876a1d4eB9a7f1ED46',
  },
  cloudflare: {
    rtwo: {
      endpoint: 'https://118f5d0e28493f6d56c5f4e6c13071cb.r2.cloudflarestorage.com',
      accessKeyId: '',
      secretAccessKey: '',
      metadataBucketHost: 'https://metadata-files-staging.chapterip.com',
    },
  },
  license: {
    oneTimeLinkActiveHours: 72,
  },
}

export default () => withEnvOverrides(config)
