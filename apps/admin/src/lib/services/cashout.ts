import { getTrpcClient } from '$lib/stores/trpc-client'

type TrpcClient = ReturnType<typeof getTrpcClient>
type CreateCashoutInput = Parameters<TrpcClient['cashouts']['createCashout']['mutate']>[0]
type GetMyCashoutsInput = Parameters<TrpcClient['cashouts']['getMyCashouts']['query']>[0]
type UpdateCashoutStatusInput = Parameters<TrpcClient['cashouts']['updateCashoutStatus']['mutate']>[0]

export async function getCashoutBalance() {
  return getTrpcClient().publishers.getMyBalance.query()
}

export async function requestCashout(input: CreateCashoutInput) {
  return getTrpcClient().cashouts.createCashout.mutate(input)
}

export async function getMyCashouts(input: GetMyCashoutsInput) {
  return getTrpcClient().cashouts.getMyCashouts.query(input)
}

export async function cancelCashout(id: string) {
  return getTrpcClient().cashouts.cancelCashout.mutate({ id })
}

export async function updateCashoutStatusByAdmin(input: UpdateCashoutStatusInput) {
  return getTrpcClient().cashouts.updateCashoutStatus.mutate(input)
}

export type { CreateCashoutInput, UpdateCashoutStatusInput }
