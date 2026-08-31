import { ethers } from '@credenza3/evm-provider'
import { connectSocketIO, disconnectSocketIO } from './socket'

export const forwardTransaction = async (
  populatedTx: ethers.ContractTransaction,
  opts: { token: string; client_id: string; evm_wss: string },
): Promise<string> => {
  const bearer_token = opts.token
  const client_id = opts.client_id

  const credenzaEnv = import.meta.env.VITE_ENV || 'staging'
  const chainId = credenzaEnv === 'prod' ? '43114' : '43113'

  const socket = await connectSocketIO(opts.evm_wss, {
    auth: { client_id, bearer_token },
  })
  populatedTx.chainId = BigInt(chainId)

  return new Promise((resolve, reject) => {
    socket.emit(
      'contracts/forward_transaction',
      {
        payload: {
          unsigned_serialized_meta_tx: ethers.Transaction.from(populatedTx).unsignedSerialized,
        },
      },
      (data: { error?: { message: string }; payload: { hash: string } }) => {
        void disconnectSocketIO(opts.evm_wss)
        if (data.error) {
          return reject(new Error(data.error.message))
        }
        resolve(data.payload.hash)
      },
    )
  })
}
