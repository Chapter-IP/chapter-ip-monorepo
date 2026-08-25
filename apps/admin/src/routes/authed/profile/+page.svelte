<script lang="ts">
  import { publisherStore } from '$lib/stores/publisher.svelte'
  import EditPublisher from './components/EditPublisher.svelte'
  import CashoutSection from './components/CashoutSection.svelte'
  import SubscriptionPriceInput from '$lib/components/SubscriptionPriceInput.svelte'
  import { useProfileSave } from '$lib/hooks/useProfileSave.svelte'
  import { authStore } from '$lib'
  import { onMount } from 'svelte'

  import type { TRPCClient, AppRouter } from '@repo/trpc/client'

  let { data }: { data: { trpcClient: TRPCClient<AppRouter> } } = $props()
  let avatarUrl = $derived(publisherStore.avatarUrl || '')
  let displayName = $state(publisherStore.title || '')
  let imageInput: HTMLInputElement | null = $state(null)
  let email = $state('')
  let emailLoading = $state(true)

  const profileSave = useProfileSave(data.trpcClient)

  onMount(async () => {
    try {
      const user = await authStore.getCurrentUser()
      email = typeof user.email === 'string' ? user.email : ''
    } catch (error) {
      console.error('Failed to load current user:', error)
    } finally {
      emailLoading = false
    }
  })

  function handlePublisherUpdate(name: string, avatar: string) {
    displayName = name
    profileSave.updatePublisherData(name, avatar)
  }

  function handleImageInput(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target?.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5 MB')
      target.value = ''
      return
    }

    publisherStore.setAvatarFile(file)
    profileSave.updatePublisherData(displayName, publisherStore.avatarUrl)
    target.value = ''
  }
</script>

<section class="min-h-xl w-full rounded-3xl bg-[#f8f5f1] px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
  <h1 class="text-[22px] font-semibold text-dark">Profile</h1>
  <p class="mt-1 text-xs text-[#ef476f]">* required indicates required field</p>

  <div class="mt-8 flex max-w-180 flex-col gap-8 sm:mt-7 sm:flex-row sm:items-start sm:gap-10">
    <div class="shrink-0">
      <button
        type="button"
        onclick={() => imageInput?.click()}
        class="group relative block rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label="Choose a profile image"
      >
        <div
          class="flex size-28 items-center justify-center overflow-hidden rounded-full border-2 border-[#d7d1cd] bg-primary text-white"
        >
          {#if !!avatarUrl}
            <img src={avatarUrl} alt="Profile preview" class="size-full object-cover" />
          {:else}
            <span class="font-heading text-[54px] font-semibold leading-none">
              {displayName?.[0]?.toUpperCase() || 'U'}
            </span>
          {/if}
        </div>

        <span
          class="absolute -bottom-2 -right-2 flex size-11 items-center justify-center rounded-full border-4 border-[#f8f5f1] bg-[#eeeae6] text-[#aaa5ad]"
        >
          <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
            <path d="M12 6v12M6 12h12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" />
          </svg>
        </span>
      </button>
    </div>

    <div class="w-full max-w-md">
      <EditPublisher onUpdate={handlePublisherUpdate} />

      <div class="mt-6">
        <label for="profile-email" class="mb-2.5 block text-sm font-medium text-[#69656d]">Email address</label>
        <input
          id="profile-email"
          type="email"
          value={email}
          placeholder={emailLoading ? 'Loading email...' : 'Email unavailable'}
          class="h-13 w-full rounded-sm border border-[#ded9d5] bg-white px-4 text-[15px] text-[#9d99a0] outline-none disabled:cursor-not-allowed disabled:opacity-100"
          disabled
        />
      </div>
    </div>
  </div>

  <div class="mt-10 flex justify-center">
    <button
      class="inline-flex h-10 min-w-28 items-center justify-center rounded-sm bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#5a28ef] disabled:cursor-not-allowed disabled:bg-[#dedad7] disabled:text-white/70"
      onclick={profileSave.handleSaveAll}
      disabled={!profileSave.hasChanges || profileSave.loading}
    >
      {#if profileSave.loading}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        Save
      {/if}
    </button>
  </div>

  <div class="my-10 border-t border-dashed border-[#ddd4cc]"></div>

  <SubscriptionPriceInput />

  <div class="my-10 border-t border-dashed border-[#ddd4cc]"></div>

  <CashoutSection />
</section>

<input
  type="file"
  class="hidden"
  bind:this={imageInput}
  onchange={handleImageInput}
  accept="image/png,image/jpeg,image/webp"
/>
