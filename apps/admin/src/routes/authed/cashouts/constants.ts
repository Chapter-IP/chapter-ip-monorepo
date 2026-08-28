export type CashoutStatus = 'pending' | 'paid' | 'rejected' | 'cancelled'
export type PaymentMethod = 'venmo' | 'cashapp'

export interface TCashoutRequest {
  id: string
  sub: string
  username: string
  platform: PaymentMethod
  amount: number
  status: CashoutStatus
  reason?: string
  createdAt: string
}

export const PaymentMethodLabel: Record<PaymentMethod, string> = {
  venmo: 'Venmo',
  cashapp: 'CashApp',
}
