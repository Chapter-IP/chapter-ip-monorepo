<script lang="ts">
  let {
    authors,
    onAdd,
    onRemove,
  }: { authors: string[]; onAdd: (name: string) => void; onRemove: (index: number) => void } = $props()

  let authorInput = $state('')

  function submit() {
    onAdd(authorInput)
    authorInput = ''
  }
</script>

<div class="block space-y-3">
  <span class="mb-2 block text-sm text-[#72717b]">Author(s)</span>
  <div class="w-full max-w-137.5">
    <input
      type="text"
      bind:value={authorInput}
      placeholder="Author"
      class="w-full h-11.75 bg-white rounded-sm border border-[#ddd] px-3.75 text-sm font-medium text-[#71707a]
        focus:border-primary focus:outline-none"
    />
  </div>

  <button
    type="button"
    onclick={submit}
    disabled={!authorInput.trim()}
    class="mt-2.5 block ml-auto text-[13px] font-medium text-primary hover:underline disabled:text-[#ddd] disabled:no-underline"
  >
    Add a co-author
  </button>

  {#if authors.length}
    <div class="flex flex-wrap gap-2 mt-3.5">
      {#each authors as author, i (author + i)}
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1.5 h-7.25 rounded-full bg-[#eae6e2] border border-[#ddd] text-base font-semibold text-[#202225] opacity-50"
        >
          {author}
          <button
            type="button"
            onclick={() => onRemove(i)}
            class="text-[#d58b00] hover:text-red-500 transition-colors text-xs leading-none"
            aria-label="Remove author {author}">✕</button
          >
        </span>
      {/each}
    </div>
  {/if}
</div>
