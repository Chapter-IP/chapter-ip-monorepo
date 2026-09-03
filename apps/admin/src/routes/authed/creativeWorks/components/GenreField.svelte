<script lang="ts">
  import { GENRE_OPTIONS } from '../constants/constants'
  import PlusIcon from '$lib/components/icons/PlusIcon.svelte'

  let {
    value,
    onToggle,
    onAdd,
  }: { value: string[]; onToggle: (genre: string) => void; onAdd: (genre: string) => void } = $props()

  let genreInputActive = $state(false)
  let newGenre = $state('')

  const customGenres = $derived(value.filter((g): g is string => !(GENRE_OPTIONS as readonly string[]).includes(g)))

  function submitCustomGenre() {
    onAdd(newGenre)
    newGenre = ''
  }
</script>

<div class="block space-y-3">
  <span class="mb-2 block text-sm text-[#72717b]">Genre</span>
  <div class="flex flex-wrap gap-2">
    {#each GENRE_OPTIONS as genre (genre)}
      <button
        type="button"
        onclick={() => onToggle(genre)}
        class="px-3.75 h-8.5 rounded-[14px] text-sm font-medium transition-colors border inline-flex items-center gap-1.5
        {value.includes(genre)
          ? 'bg-primary border-primary text-cream'
          : 'bg-[#eae6e2] border-[#71707a]/25 text-dark opacity-60 hover:opacity-100'}"
      >
        {genre}
        <PlusIcon class="shrink-0" />
      </button>
    {/each}
    {#each customGenres as custom (custom)}
      <button
        type="button"
        onclick={() => onToggle(custom)}
        class="px-3.75 h-8.5 rounded-[14px] text-sm font-medium transition-colors border inline-flex items-center gap-1.5 bg-primary border-primary text-cream"
      >
        {custom}
        <PlusIcon class="shrink-0" />
      </button>
    {/each}

    {#if genreInputActive}
      <div class="flex items-center gap-1">
        <input
          type="text"
          bind:value={newGenre}
          placeholder="Add genre"
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitCustomGenre()
            }
          }}
          class="w-32 h-8.5 rounded-[14px] border border-[#71707a]/25 bg-white px-3 text-sm text-dark outline-none focus:border-primary"
        />
        <button
          type="button"
          onclick={submitCustomGenre}
          class="w-8.5 h-8.5 rounded-full bg-primary text-cream text-lg leading-none">+</button
        >
      </div>
    {:else}
      <button
        type="button"
        onclick={() => (genreInputActive = true)}
        class="px-3.75 h-8.5 rounded-[14px] text-sm font-medium bg-[#eae6e2] border border-[#71707a]/25 text-dark opacity-60 hover:opacity-100 inline-flex items-center gap-1.5"
      >
        Add
        <PlusIcon class="shrink-0" />
      </button>
    {/if}
  </div>
</div>
