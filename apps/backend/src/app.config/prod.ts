import { withEnvOverrides } from '#backend/common/utils/utils.js'

const config = {
  credenza: {
    clientId: '',
    clientSecret: '',
    accountsUrl: 'https://accounts.credenza3.com',
    evmUrl: 'https://evm.credenza3.com',
  },
  evm: {
    rpcUrl: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-c-chain-rpc.publicnode.com'],
    contentNftContractAddress: '0x677c95a69ACf072F7e5af943aD3561feE0dd166b',
    licenseNftContractAddress: '0xeb85E9a26e626389640be966fB62Ad1b70fC45a3',
    membershipContractAddress: '0x031d3E3D026480C938cC4AC4605EcCc57910F5CB',
  },
  cloudflare: {
    rtwo: {
      metadataBucketHost: 'https://metadata-files.chapterip.com',
    },
  },
}

export default () => withEnvOverrides(config)
