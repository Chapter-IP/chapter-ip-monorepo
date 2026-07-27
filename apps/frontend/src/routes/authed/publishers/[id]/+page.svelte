<script lang="ts">
  import { useDefaultImage } from '$lib/content/image'
  // import { onMount } from 'svelte'
  // import { verifyMembership } from '$lib/membership/index.js'
  // import type { Passport } from '@credenza3/passport-evm'
  // import { get } from 'svelte/store'
  // import { passportStore } from '$lib/passport.store'
  // import { goto } from '$app/navigation'

  let { data } = $props()
  // let hasMembership = $state(false)
  // let pass: Passport | null = $state(null)

  // const purchaseSubscription = async () => {
  //   const title = `Subscription license for ChapterIP`
  //   pass?.openUI('payment', {
  //     title,
  //     memberships: [
  //       {
  //         contractAddress: import.meta.env.VITE_EVM_MEMBERSHIP_CONTRACT_ADDRESS,
  //         membershipTokenId: String(BigInt(data.publisher.evmAddress || '')),
  //       },
  //     ],
  //   })
  //   pass?.once('PAYMENT', async () => goto('/authed/purchases'))
  // }

  // onMount(async () => {
  //   pass = get(passportStore)
  //   hasMembership = await verifyMembership(data.publisher.evmAddress || '', data.userAddress || '')
  // })
</script>

<div class="mx-auto w-full max-w-360 px-6">
  <section
    class="rounded-2xl border border-[#ebe6df] bg-[#f8f5f1] px-4 py-8 sm:px-6 lg:px-13 lg:py-12"
    aria-labelledby="publisher-heading"
  >
    <div class="space-y-2.5">
      {#if data.publisher.avatarUrl}
        <img
          src={data.publisher.avatarUrl}
          alt={data.publisher.title}
          class="size-18.75 shrink-0 rounded-full object-cover"
        />
      {:else}
        <div
          class="flex size-18.75 shrink-0 items-center justify-center rounded-full bg-primary text-white text-3xl font-semibold"
        >
          {data.publisher.title?.slice(0, 1)?.toUpperCase()}
        </div>
      {/if}
      <h1 id="publisher-heading" class="text-2xl font-bold text-dark">{data.publisher.title}</h1>
      <!-- {#if !hasMembership}
        {#if data.hasSubscription}
          <button
            class="mt-6.25 rounded-full border border-[#ddd] bg-[#eae6e2] px-6 py-1.5 text-base font-semibold text-[#202225]/50 cursor-pointer"
            onclick={purchaseSubscription}
          >
            Subscribe
          </button>
        {/if}
      {:else}
        <div class="p-2 my-2">
          <span>You are subscribed to this publisher.</span>
        </div>
      {/if} -->
    </div>
    {#if data.items.length > 0}
      <div class="grid grid-cols-1 gap-x-6 gap-y-12 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mt-15.5">
        {#each data.items as item (item.id)}
          <a href={`/authed/${item.type}/${item.id}`} class="group min-w-0">
            <div class="overflow-hidden rounded-lg bg-black">
              <img
                src={item.imageUrl}
                alt={item.name}
                class="w-full object-cover transition-opacity group-hover:opacity-85"
                style="aspect-ratio: 324/175"
                onerror={useDefaultImage}
              />
            </div>
            <h3 class="mt-2 truncate text-base font-semibold text-dark">{item.name}</h3>
            <p class="mt-2.5 font-medium leading-4.5 text-[#747474] text-xs">
              {item.description}
            </p>
          </a>
        {/each}
      </div>
    {:else}
      <div class="py-16 text-center">
        <p class="text-[#747474]">No publications yet.</p>
      </div>
    {/if}
  </section>
</div>
