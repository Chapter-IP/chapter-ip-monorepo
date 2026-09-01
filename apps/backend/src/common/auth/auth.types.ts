import type { TAppContext } from '../../app.context.js'
import type { TAppContextWithClientInfo } from '../client/client.types.js'

import { CLAIMS, TOKEN_USE } from './auth.constants.js'

export type TAuthTokenPayload = {
  [CLAIMS.ISSUED_AT]: number
  [CLAIMS.EXPIRES_AT]: number
  [CLAIMS.AUDIENCE]: string
  [CLAIMS.ISSUER]: string
  [CLAIMS.SUBJECT]: string
  [CLAIMS.SCOPE]: string
  [CLAIMS.TOKEN_TYPE]: 'Bearer'
  [CLAIMS.TOKEN_USE]: (typeof TOKEN_USE)[keyof typeof TOKEN_USE]
  [CLAIMS.NONCE]?: string
}

export type TAppContextWithTokenPayload = TAppContext & {
  authTokenPayload: TAuthTokenPayload
}

export type TAppContextClientAdmin = TAppContextWithTokenPayload & TAppContextWithClientInfo
