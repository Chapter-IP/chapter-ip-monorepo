<script lang="ts">
  let { currentStep = 1 } = $props<{ currentStep: number }>()

  const steps = [1, 2, 3]

  function barColor(step: number): string {
    if (step < currentStep) {
      if (step === 1 && currentStep === 3) return 'bg-[#d5c6f5]'
      return 'bg-primary/25'
    }
    if (step === currentStep) return 'bg-primary'
    return 'bg-[#e1dddb]'
  }
</script>

<div class="mt-12.5">
  <div class="flex items-center gap-1 mb-2">
    {#each steps as step (step)}
      <div class="h-2.5 w-12.5 rounded-full transition-colors {barColor(step)}"></div>
    {/each}
  </div>

  <div class="text-xs font-medium text-[#72717b]">
    Step {currentStep} of {steps.length}
  </div>
</div>
