<script lang="ts">
  import { goto } from '$app/navigation'
  import { configStore, ContractName } from '$lib/stores/config.svelte'
  import WorkPurchasePage from './WorkPurchasePage.svelte'
  import { normalizeWork } from './workDetails'
  import { toWorkItems, type WorkItem } from '../works'
  import type { WorkDetails } from '@repo/content-types/works'

  let { data } = $props()
  let workDetails = $state<WorkDetails | null>(null)
  let similarWorks = $state<WorkItem[]>([])
  let loading = $state(true)

  $effect(() => {
    let cancelled = false
    loading = true
    ;(async () => {
      try {
        const content = await data.trpcClient.contents.getContentById.query({ id: data.id })
        if (cancelled) return
        if (content.status !== 'ACTIVE') return void (await goto('/authed/creative-works'))
        const contractAddress = configStore.getContractAddress(ContractName.CONTENT_NFT)
        const normalized = normalizeWork(content, contractAddress)
        if (!normalized) return void (await goto('/authed/creative-works'))
        workDetails = normalized
        similarWorks = toWorkItems(content.similarContents ?? [], contractAddress)
      } catch {
        if (!cancelled) await goto('/authed/creative-works')
      } finally {
        if (!cancelled) loading = false
      }
    })()
    return () => {
      cancelled = true
    }
  })
</script>

{#if loading}
  <div
    class="mx-auto min-h-120 w-full max-w-293.75 animate-pulse rounded-3xl bg-[#f8f5f1] p-10"
    aria-label="Loading creative work"
  ></div>
{:else if workDetails}
  <WorkPurchasePage {workDetails} {similarWorks} />
{/if}
