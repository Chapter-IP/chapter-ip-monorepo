import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type JWTPayload, type JSONWebKeySet } from 'jose'

import type { TAuthTokenPayload } from './auth.types.js'
import { BEARER_TOKEN } from './auth.constants.js'

@Injectable()
export class CommonAuthService {
  constructor(private readonly configService: ConfigService) {}

  async fetchJWKS(jwksUrl: string) {
    const response = await fetch(jwksUrl)
    const json = (await response.json()) as JSONWebKeySet
    if (!response.ok || !json?.keys?.length) {
      throw new Error(`Cannot get JWKS: ${response.statusText}`)
    }
    return json
  }

  extractToken(authorizationHeader: string) {
    const [type, token] = authorizationHeader.split(' ')
    if (type?.toLowerCase() !== BEARER_TOKEN.toLowerCase()) {
      throw new Error('Invalid token')
    }
    if (!token) {
      throw new Error('Cannot get the Authorization token from header')
    }
    return { token, type }
  }

  async verifyToken(
    token: string,
    params: {
      issuer?: string
      audience?: string
    },
  ) {
    const { jwtVerify, createRemoteJWKSet } = await import('jose')
    const accountsUrl = this.configService.get<string>('credenza.accountsUrl')
    const JWKS = createRemoteJWKSet(new URL(`${accountsUrl}/jwks`))

    const { payload } = await jwtVerify(token, JWKS, {
      ...(params.issuer && { issuer: params.issuer }),
      ...(params.audience && { audience: params.audience }),
    })

    return payload as JWTPayload & TAuthTokenPayload
  }
}
