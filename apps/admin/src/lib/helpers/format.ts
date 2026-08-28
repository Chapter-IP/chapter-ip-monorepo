export function formatPrice(cents: number): string {
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(cents / 100)}`
}
