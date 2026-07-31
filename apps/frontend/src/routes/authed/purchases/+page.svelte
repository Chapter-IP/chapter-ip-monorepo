<script lang="ts">
  import PurchasedItem from './PurchasedItem.svelte'

  let { data } = $props()

  const purchases = $derived([...data.lifetimeLicenses, ...data.onetimeLicenses])
</script>

<main class="min-h-screen bg-cream px-4 py-8 text-dark sm:px-6 lg:px-8">
  <div class="mx-auto w-full max-w-5xl">
    <header class="mb-8 sm:mb-10">
      <h1 class="font-heading text-4xl leading-11 font-semibold text-dark">Purchases</h1>
    </header>

    {#if !purchases.length}
      <div
        class="flex flex-col gap-4 border border-[#1a1a2e1a] bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>You haven't made any purchases yet.</span>
        <a href="/authed" class="btn rounded-none border-primary bg-primary px-5 text-white">Browse Items</a>
      </div>
    {:else if !data.purchaseRows.length}
      <div class="border border-[#1a1a2e1a] bg-white p-6">
        <p>No supported purchases yet.</p>
      </div>
    {:else}
      <section aria-label="Purchased items" class="divide-y divide-[#1a1a2e1a] border-y border-[#1a1a2e1a]">
        {#each data.purchaseRows as row (`${row.purchase.licenseTokenId}-${row.purchase.id}`)}
          <PurchasedItem purchase={row.purchase} item={row.item} trpcClient={data.trpcClient} />
        {/each}
      </section>
    {/if}
  </div>
</main>
