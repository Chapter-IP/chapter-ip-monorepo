<script lang="ts">
  import Edit from '$lib/assets/edit.svg'
  import { getTrpcClient } from '$lib/stores/trpc-client'
  import { notify, ToastType } from '@repo/ui-components'
  import { STATUS, type StatusValue } from '../../routes/authed/likeness/constants/constants'

  const STATUS_MAP = {
    DRAFT: { label: 'Draft', classes: 'text-[#d58b00]', img: Edit },
    ACTIVE: { label: '✓ Active', classes: 'text-[#499b60]', img: undefined },
    SALE_DISABLED: { label: '✗ Disabled', classes: 'text-[#d14e4e]', img: undefined },
  }

  let { status = $bindable(STATUS.ACTIVE), contentId }: { contentId: string; status: StatusValue } = $props()

  let updating = $state(false)
  let currentStatus = $state(status)

  const trpcClient = getTrpcClient()

  const cfg = $derived(STATUS_MAP[currentStatus])

  async function handleToggle() {
    if (updating) return
    const newStatus = currentStatus === STATUS.ACTIVE ? STATUS.SALE_DISABLED : STATUS.ACTIVE
    updating = true
    try {
      await trpcClient.contents.updateContentMetadata.mutate({ contentId, status: newStatus })
      currentStatus = newStatus
      status = newStatus
      notify('Status updated', ToastType.SUCCESS)
    } catch {
      notify('Failed to update status', ToastType.FAIL)
    } finally {
      updating = false
    }
  }
</script>

<div class="flex items-center gap-2">
  {#if currentStatus !== STATUS.DRAFT}
    <input
      type="checkbox"
      class="toggle toggle-sm"
      checked={currentStatus === STATUS.ACTIVE}
      disabled={updating}
      onchange={handleToggle}
    />
  {/if}
  <span class="inline-flex items-center gap-1 px-2.5 py-1.25 rounded-sm text-sm {cfg.classes} whitespace-nowrap">
    {#if cfg.img}
      <img src={cfg.img} alt="" class="size-2.5" />
    {/if}
    {cfg.label}
  </span>
</div>
