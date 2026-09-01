<script lang="ts">
  import { formatDate } from '../../files/helper'
  import { PaymentMethodLabel, type TCashoutRequest } from '../constants'
  import { formatPrice } from '$lib/helpers/format'
  import { getUserBySub } from '$lib/services/account'
  import CashoutStatusCell from './CashoutStatusCell.svelte'

  let {
    request,
    index,
    onAccept,
    onReject,
  }: {
    request: TCashoutRequest
    index: number
    onAccept: (id: string) => void
    onReject: (id: string) => void
  } = $props()
</script>

<tr class="border-b border-[#ddd] last:border-0 {index % 2 === 0 ? 'bg-[#f8f5f1]' : 'bg-cream'}">
  <td class="px-4 py-1.5 whitespace-nowrap">{formatDate(request.createdAt)}</td>
  {#await getUserBySub(request.sub)}
    <td class="px-4 py-1.5">…</td>
    <td class="px-4 py-1.5 whitespace-nowrap">…</td>
  {:then user}
    <td class="px-4 py-1.5">{user.name}</td>
    <td class="px-4 py-1.5 whitespace-nowrap">{user.email}</td>
  {:catch}
    <td class="px-4 py-1.5">—</td>
    <td class="px-4 py-1.5 whitespace-nowrap">—</td>
  {/await}
  <td class="px-4 py-1.5">{PaymentMethodLabel[request.platform]}</td>
  <td class="px-4 py-1.5 whitespace-nowrap">{request.username}</td>
  <td class="px-4 py-1.5">{formatPrice(request.amount)}</td>
  <td class="px-4 py-1.5">
    <CashoutStatusCell {request} {onAccept} {onReject} />
  </td>
</tr>
