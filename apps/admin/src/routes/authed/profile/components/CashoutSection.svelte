<script lang="ts">
  import { onMount } from 'svelte'
  import { notify, ToastType } from '@repo/ui-components'
  import { useCursorPagination } from '$lib/hooks/useCursorPagination.svelte'
  import { TABLE_PAGE_SIZE } from '$lib/constants'
  import {
    cancelCashout,
    getCashoutBalance,
    getMyCashouts,
    requestCashout,
    type CreateCashoutInput,
  } from '$lib/services/cashout'
  import CashoutForm from './CashoutForm.svelte'
  import CashoutRequestsList from './CashoutRequestsList.svelte'

  type CashoutItem = Awaited<ReturnType<typeof getMyCashouts>>['items'][number]
  type CashoutPlatform = CreateCashoutInput['platform']

  let available = $state(0)
  let pending = $state(0)
  let loading = $state(true)
  let submitting = $state(false)
  let platform = $state<CashoutPlatform | ''>('')
  let username = $state('')
  let cancellingId = $state<string | null>(null)

  const formattedAvailable = $derived(
    `$${(available / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
  )
  const formattedPending = $derived(
    `$${(pending / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
  )
  const trimmedUsername = $derived(username.trim())
  const usernameValid = $derived(/^@\S+$/.test(trimmedUsername))
  const canSubmit = $derived(
    available > 0 && !submitting && !loading && platform !== '' && usernameValid && trimmedUsername.length <= 128,
  )

  const pagination = useCursorPagination<CashoutItem>({
    fetchPage: (cursor) =>
      getMyCashouts({
        limit: String(TABLE_PAGE_SIZE),
        sort: 'createdAt',
        order: 'desc',
        ...(cursor ? { cursor } : {}),
      }),
    onError: (err) => {
      console.error('Failed to load cash out requests', err)
      notify('Failed to load cash out requests', ToastType.FAIL)
    },
  })

  async function loadBalance() {
    const bal = await getCashoutBalance()
    available = bal.available
    pending = bal.pending
  }

  onMount(async () => {
    try {
      await loadBalance()
    } catch {
      notify('Failed to load cash out balance', ToastType.FAIL)
    } finally {
      loading = false
    }
  })

  async function refreshCashoutData() {
    try {
      await loadBalance()
      await pagination.reload()
    } catch {
      notify('Failed to refresh cash out data', ToastType.FAIL)
    }
  }

  async function handleCashout() {
    if (!canSubmit || platform === '') return

    submitting = true
    try {
      await requestCashout({
        amount: available,
        platform: platform as CashoutPlatform,
        username: trimmedUsername,
      })
      notify('Cash out requested successfully', ToastType.SUCCESS)
      platform = ''
      username = ''
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Failed to request cash out'
      notify(message, ToastType.FAIL)
      submitting = false
      return
    }

    await refreshCashoutData()
    submitting = false
  }

  async function handleCancel(id: string) {
    if (cancellingId) return

    cancellingId = id
    try {
      await cancelCashout(id)
      notify('Cash out cancelled', ToastType.SUCCESS)
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Failed to cancel cash out'
      notify(message, ToastType.FAIL)
      cancellingId = null
      return
    }

    await refreshCashoutData()
    cancellingId = null
  }
</script>

<div class="w-full">
  <CashoutForm
    {loading}
    {submitting}
    {available}
    {pending}
    {formattedAvailable}
    {formattedPending}
    {canSubmit}
    usernameError={trimmedUsername !== '' && !usernameValid}
    bind:platform
    bind:username
    onCashout={handleCashout}
  />
  <div class="my-10 border-t border-dashed border-[#ddd4cc]"></div>
  <CashoutRequestsList
    items={pagination.items}
    loading={pagination.loading}
    {cancellingId}
    from={pagination.items.length ? pagination.currentPage * TABLE_PAGE_SIZE + 1 : 0}
    to={pagination.currentPage * TABLE_PAGE_SIZE + pagination.items.length}
    total={pagination.totalCount}
    previousDisabled={pagination.currentPage === 0 || pagination.loading}
    nextDisabled={!pagination.hasNext || pagination.loading}
    onCancel={handleCancel}
    onPrevious={pagination.prevPage}
    onNext={pagination.nextPage}
  />
</div>
