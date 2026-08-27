import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { TClientInfo } from './client.types'

@Injectable()
export class CommonClientService {
  constructor(private readonly configService: ConfigService) {}
  getClientIdAndSecret(): { clientId: string; clientSecret: string } {
    const clientId = this.configService.get<string>('credenza.clientId')
    if (!clientId) {
      throw new Error('Missing CREDENZA_CLIENT_ID')
    }
    const clientSecret = this.configService.get<string>('credenza.clientSecret')
    if (!clientSecret) {
      throw new Error('Missing CREDENZA_CLIENT_SECRET')
    }
    return { clientId, clientSecret }
  }

  formatBasicToken() {
    const { clientId, clientSecret } = this.getClientIdAndSecret()
    const credentials = `${clientId}:${clientSecret}`
    const basicToken = Buffer.from(credentials).toString('base64')
    const authorizationHeader = `Basic ${basicToken}`
    return { authorizationHeader, basicToken }
  }

  async getActiveClient() {
    const accountsUrl = this.configService.getOrThrow<string>('credenza.accountsUrl')

    const response = await fetch(`${accountsUrl}/clients/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.formatBasicToken().authorizationHeader,
      },
    })
    if (!response.ok) {
      throw new Error('Cannot get active client')
    }
    const json = (await response.json()) as TClientInfo
    return json
  }

  async verifySubIsClientAdmin(sub: string) {
    const client = await this.getActiveClient()
    return client.owner_id === sub || client.admins.includes(sub)
  }
}
