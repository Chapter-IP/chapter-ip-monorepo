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

export const CASHOUT_FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Paid'] as const

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
  {
    id: '7',
    publisherName: 'Eva Martinez',
    publisherEmail: 'eva@example.com',
    paymentMethod: 'Venmo',
    amount: 95000,
    status: 'pending',
    createdAt: '2025-01-09T13:55:00Z',
  },
  {
    id: '8',
    publisherName: 'Frank Garcia',
    publisherEmail: 'frank@example.com',
    paymentMethod: 'CashApp',
    amount: 420000,
    status: 'paid',
    createdAt: '2025-01-08T07:30:00Z',
  },
  {
    id: '9',
    publisherName: 'Grace Lee',
    publisherEmail: 'grace@example.com',
    paymentMethod: 'Venmo',
    amount: 60000,
    status: 'rejected',
    createdAt: '2025-01-07T15:40:00Z',
  },
  {
    id: '10',
    publisherName: 'Henry Wilson',
    publisherEmail: 'henry@example.com',
    paymentMethod: 'CashApp',
    amount: 140000,
    status: 'pending',
    createdAt: '2025-01-06T10:05:00Z',
  },
  {
    id: '11',
    publisherName: 'Iris Chen',
    publisherEmail: 'iris@example.com',
    paymentMethod: 'Venmo',
    amount: 275000,
    status: 'approved',
    createdAt: '2025-01-05T12:25:00Z',
  },
  {
    id: '12',
    publisherName: 'Jack Thompson',
    publisherEmail: 'jack@example.com',
    paymentMethod: 'CashApp',
    amount: 88000,
    status: 'paid',
    createdAt: '2025-01-04T08:50:00Z',
  },
  {
    id: '13',
    publisherName: 'Karen White',
    publisherEmail: 'karen@example.com',
    paymentMethod: 'Venmo',
    amount: 195000,
    status: 'pending',
    createdAt: '2025-01-03T14:15:00Z',
  },
  {
    id: '14',
    publisherName: 'Leo Harris',
    publisherEmail: 'leo@example.com',
    paymentMethod: 'CashApp',
    amount: 310000,
    status: 'rejected',
    createdAt: '2025-01-02T09:35:00Z',
  },
  {
    id: '15',
    publisherName: 'Mia Clark',
    publisherEmail: 'mia@example.com',
    paymentMethod: 'Venmo',
    amount: 120000,
    status: 'approved',
    createdAt: '2025-01-01T11:00:00Z',
  },
]
