<script lang="ts">
  interface Props {
    value?: string
  }

  let { value = $bindable('') }: Props = $props()
</script>

<div class="w-full">
  <label for="publisher-name" class="mb-2.5 block text-sm font-medium text-[#69656d]">
    Your Name (First and Last) <span class="text-[#ef476f]">*</span>
  </label>
  <input
    id="publisher-name"
    type="text"
    bind:value
    placeholder="Your name"
    autocomplete="name"
    class="h-13 w-full rounded-sm border border-[#ded9d5] bg-white px-4 text-[15px] text-dark outline-none transition-colors placeholder:text-[#c0bcc2] focus:border-primary focus:ring-1 focus:ring-primary"
    required
  />
</div>
