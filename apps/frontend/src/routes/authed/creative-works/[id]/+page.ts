export const load = async ({ params, parent }) => {
  const { trpcClient } = await parent()
  if (!trpcClient) throw new Error('tRPC client is not initialized')
  return { id: params.id, trpcClient }
}
