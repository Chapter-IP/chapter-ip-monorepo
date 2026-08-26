export type CashoutStatus = 'pending' | 'approved' | 'rejected' | 'paid'
export type PaymentMethod = 'Venmo' | 'CashApp'

export interface TCashoutRequest {
  id: string
  publisherName: string
  publisherEmail: string
  paymentMethod: PaymentMethod
  amount: number
  status: CashoutStatus
  createdAt: string
}

export const CashoutMenuItems: { text: string; action: string }[] = []

export const MOCK_CASHOUT_REQUESTS: TCashoutRequest[] = [
  {
    id: '1',
    publisherName: 'John Smith',
    publisherEmail: 'john@example.com',
    paymentMethod: 'Venmo',
    amount: 150000,
    status: 'pending',
    createdAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '2',
    publisherName: 'Jane Doe',
    publisherEmail: 'jane@example.com',
    paymentMethod: 'CashApp',
    amount: 75000,
    status: 'approved',
    createdAt: '2025-01-14T08:15:00Z',
  },
  {
    id: '3',
    publisherName: 'Alice Johnson',
    publisherEmail: 'alice@example.com',
    paymentMethod: 'Venmo',
    amount: 220000,
    status: 'rejected',
    createdAt: '2025-01-13T14:45:00Z',
  },
  {
    id: '4',
    publisherName: 'Bob Williams',
    publisherEmail: 'bob@example.com',
    paymentMethod: 'CashApp',
    amount: 50000,
    status: 'paid',
    createdAt: '2025-01-12T09:00:00Z',
  },
  {
    id: '5',
    publisherName: 'Carol Davis',
    publisherEmail: 'carol@example.com',
    paymentMethod: 'Venmo',
    amount: 320000,
    status: 'pending',
    createdAt: '2025-01-11T16:20:00Z',
  },
  {
    id: '6',
    publisherName: 'David Brown',
    publisherEmail: 'david@example.com',
    paymentMethod: 'CashApp',
    amount: 180000,
    status: 'approved',
    createdAt: '2025-01-10T11:10:00Z',
  },
]
