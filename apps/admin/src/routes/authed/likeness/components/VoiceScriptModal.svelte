<script lang="ts">
  import { voiceScript } from '../service/voice-script'
  import { downloadVoiceScript, getNumberedLines, splitPlaceholders } from '../service/voice-script-helpers'
  import type { TVoiceScriptModalProps } from '../types/voice-script.types'

  let { close, isOpen }: TVoiceScriptModalProps = $props()
  const numberedLines = getNumberedLines(voiceScript)
</script>

{#snippet scriptLine(line: string)}
  {#each splitPlaceholders(line) as segment (segment.text + segment.dark)}
    <span class={segment.dark ? 'text-dark' : ''}>{segment.text}</span>
  {/each}
{/snippet}

{#snippet divider(size = 'my-[35px]')}
  <div class="border-t border-[#ddd] border-dashed {size}"></div>
{/snippet}

{#if isOpen}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="voice-script-title"
    class="z-20 flex justify-center items-start fixed top-20 bottom-5 left-0 right-0 mx-3"
  >
    <div
      class="relative bg-cream rounded-xl border border-[#1a1a2e33] w-full max-w-225 h-full overflow-y-auto px-6 md:pl-13 md:pr-18 pt-14.5 pb-31.25"
    >
      <button
        type="button"
        aria-label="Close"
        class="text-[20px] text-[#70707080] rounded-none absolute right-5 top-4 cursor-pointer"
        onclick={() => close()}>✕</button
      >

      <h2 id="voice-script-title" class="text-[22px] font-semibold text-dark">{voiceScript.title}</h2>

      <div class="mt-5.5 space-y-6">
        {#each voiceScript.intro as paragraph, i (i)}
          <p class="text-base text-[#747474] leading-6">
            {#each paragraph as segment, i (i)}
              <span class={segment.semibold ? 'font-semibold text-dark' : ''}>{segment.text}</span>
            {/each}
          </p>
        {/each}
      </div>

      {@render divider('my-6')}

      <div class="flex justify-between items-baseline">
        <h3 class="text-base font-semibold text-dark">{voiceScript.beforeYouStart.title}</h3>
        <span class="text-sm text-[#747474] whitespace-nowrap">{voiceScript.beforeYouStart.label}</span>
      </div>
      <ul class="mt-2.5 ml-3.5">
        {#each voiceScript.beforeYouStart.bullets as bullet (bullet)}
          <li class="flex gap-2 text-base text-[#747474] leading-8">
            <span class="shrink-0">•</span>
            <span>{bullet}</span>
          </li>
        {/each}
      </ul>
      <div class="mt-4 flex">
        <button
          type="button"
          class="font-sans text-sm font-medium text-primary flex items-center gap-2 cursor-pointer"
          onclick={downloadVoiceScript}
        >
          Download script
          <span class="text-[20px] self-end">↘</span>
        </button>
      </div>

      {@render divider()}

      {#each voiceScript.sections as section, si (section.title)}
        <section>
          <div class="flex justify-between items-baseline">
            <h3 class="text-[22px] font-semibold text-dark">{section.title}</h3>
            {#if section.duration}
              <span class="text-sm text-[#747474] whitespace-nowrap">{section.duration}</span>
            {/if}
          </div>
          {#if section.instruction}
            <p class="text-sm text-[#747474] mt-1">{section.instruction}</p>
          {/if}

          <div class="mt-7.75 space-y-4">
            {#each section.blocks as block, bi (block.label ?? `${si}-${bi}`)}
              <div>
                {#if block.label}
                  <p class="text-base font-semibold text-dark">{block.label}</p>
                {/if}
                <div class={block.label ? 'mt-1' : ''} class:space-y-[37px]={block.paragraphGap}>
                  {#each block.lines as line, li (bi + '-' + li)}
                    {#if section.numbered}
                      <div class="flex gap-4">
                        <span class="shrink-0 w-6 text-right text-base font-medium text-[#747474]"
                          >{numberedLines[si][bi][li]}.</span
                        >
                        <p class="text-base text-[#747474] font-georgia italic leading-6">
                          {@render scriptLine(line)}
                        </p>
                      </div>
                    {:else}
                      <p class="text-base text-[#747474] font-georgia italic {block.label ? 'leading-6' : 'leading-7'}">
                        {@render scriptLine(line)}
                      </p>
                    {/if}
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          {#if section.closingInstruction}
            <p class="text-sm text-[#747474] mt-8.75 leading-6">{section.closingInstruction}</p>
          {/if}
        </section>

        {@render divider()}
      {/each}

      <div class="flex justify-between items-baseline">
        <h3 class="text-base font-semibold text-dark">{voiceScript.coverageChecklist.title}</h3>
        <span class="text-sm text-[#747474] whitespace-nowrap">{voiceScript.coverageChecklist.label}</span>
      </div>
      <ul class="mt-3 space-y-5">
        {#each voiceScript.coverageChecklist.items as item (item)}
          <li class="flex gap-2 text-base text-[#747474]">
            <span class="shrink-0">•</span>
            <span>{item}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}
