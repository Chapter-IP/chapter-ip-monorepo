<script lang="ts">
  let { class: className = '', color = 'currentColor' } = $props()
</script>

<svg
  width="8"
  height="8"
  viewBox="0 0 8 8"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class={className}
  stroke={color}
  aria-hidden="true"
>
  <path d="M4 0v8M0 4h8" stroke-width="2" stroke-linecap="round" />
</svg>
