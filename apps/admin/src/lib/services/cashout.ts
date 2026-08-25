// ponytail: mock cashout API — swap for real endpoint when backend exists

export async function getCashoutBalance(): Promise<{ available: number; pending: number }> {
  await new Promise((r) => setTimeout(r, 200))
  return { available: 1500, pending: 0 }
}

export async function requestCashout(input: {
  amount: number
  paymentMethod: 'venmo' | 'cashapp'
  username: string
}): Promise<{ success: true }> {
  void input // ponytail: mock always succeeds
  await new Promise((r) => setTimeout(r, 400))
  return { success: true }
}
