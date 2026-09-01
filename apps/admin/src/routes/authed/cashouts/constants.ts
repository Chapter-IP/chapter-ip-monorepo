export type CashoutStatus = 'pending' | 'paid' | 'rejected' | 'cancelled'
export type PaymentMethod = 'venmo' | 'cashapp'

export type PaymentDecisionModalProps = {
  variant: 'accept' | 'decline'
  publisherName: string
  paymentMethod: string
  amount: number
  onCancel?: () => void
  onConfirm?: (reason: string) => void | Promise<void>
}

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

export const STATUS_CONFIG: Record<CashoutStatus, { label: string; classes: string }> = {
  paid: { label: '✓ Payment accepted', classes: 'text-[#499b60]' },
  rejected: { label: '✗ Payment rejected', classes: 'text-[#f80000]' },
  cancelled: { label: 'Cancelled', classes: 'text-dark/40' },
  pending: { label: '', classes: '' },
}

export const FILTERS = ['All', 'Accepted', 'Rejected', 'Pending'] as const
