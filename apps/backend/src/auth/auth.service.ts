import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { CommonClientService } from '#backend/common/client/client.service.js'

import type { TExchangeCodeInput, TRefreshTokenInput, TAuthTokenOutput } from './auth.dto.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly commonClientService: CommonClientService,
    private readonly configService: ConfigService,
  ) {}

  async refreshToken(payload: TRefreshTokenInput): Promise<TAuthTokenOutput> {
    const urlEncoded = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: payload.refreshToken,
    })

    const accountsUrl = this.configService.get<string>('credenza.accountsUrl')

    const response = await fetch(`${accountsUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: this.commonClientService.formatBasicToken().authorizationHeader,
      },
      body: urlEncoded.toString(),
    })
    if (!response.ok) {
      console.log(`Refresh response:`, await response.json(), response.status, response.statusText)
      throw new Error(`Cannot refresh token`)
    }
    const json = (await response.json()) as {
      access_token: string
      refresh_token?: string
      id_token?: string
    }

    return {
      accessToken: json.access_token,
      ...(json.refresh_token && { refreshToken: json.refresh_token }),
      ...(json.id_token && { idToken: json.id_token }),
    }
  }

  async exchangeCode(payload: TExchangeCodeInput): Promise<TAuthTokenOutput> {
    const urlEncoded = new URLSearchParams({
      grant_type: 'authorization_code',
      code: payload.code,
      code_verifier: payload.codeVerifier,
      redirect_uri: payload.redirectUri,
    })

    const accountsUrl = this.configService.getOrThrow<string>('credenza.accountsUrl')
    console.log('accountsUrl', accountsUrl)

    const response = await fetch(`${accountsUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: this.commonClientService.formatBasicToken().authorizationHeader,
      },
      body: urlEncoded.toString(),
    })

    if (!response.ok) {
      console.log(`Response:`, await response.json(), response.status, response.statusText)
      throw new Error('Cannot exchange code for token')
    }
    const json = (await response.json()) as {
      access_token: string
      refresh_token?: string
      id_token?: string
    }

    return {
      accessToken: json.access_token,
      ...(json.refresh_token && { refreshToken: json.refresh_token }),
      ...(json.id_token && { idToken: json.id_token }),
    }
  }
}
