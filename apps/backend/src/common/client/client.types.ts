import type { TAppContext } from '#backend/app.context.js'

export type TClientInfo = {
  id: string
  client_secret: string
  name: string
  callback_uris: string[]
  confidential: boolean
  owner_id: string
  access_token_ttl_minutes: number
  available_login_types: string[]
  admins: string[]
  api_permissions: string[]
}

export type TAppContextWithClientInfo = TAppContext & {
  clientInfo: TClientInfo
}
