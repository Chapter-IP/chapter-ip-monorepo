import { Logger } from '@nestjs/common'
import { Router, Mutation, Input } from 'nestjs-trpc'
import { TRPCError } from '@trpc/server'

import {
  authTokenOutputSchema,
  refreshTokenInputSchema,
  exchangeCodeInputSchema,
  type TExchangeCodeInput,
  type TRefreshTokenInput,
  type TAuthTokenOutput,
} from './auth.dto.js'
import { AuthService } from './auth.service.js'

@Router({ alias: 'auth' })
export class AuthRouter {
  private logger = new Logger(this.constructor.name)

  constructor(private readonly authService: AuthService) {}

  @Mutation({
    input: refreshTokenInputSchema,
    output: authTokenOutputSchema,
  })
  async refreshToken(@Input() input: TRefreshTokenInput): Promise<TAuthTokenOutput> {
    try {
      return await this.authService.refreshToken(input)
    } catch (err) {
      this.logger.error(err)
      throw new TRPCError({ message: (err as Error).message, code: 'UNAUTHORIZED' })
    }
  }

  @Mutation({
    input: exchangeCodeInputSchema,
    output: authTokenOutputSchema,
  })
  async exchangeCode(@Input() input: TExchangeCodeInput): Promise<TAuthTokenOutput> {
    try {
      return await this.authService.exchangeCode(input)
    } catch (err) {
      this.logger.error(err)
      throw new TRPCError({ message: (err as Error).message, code: 'UNAUTHORIZED' })
    }
  }
}
