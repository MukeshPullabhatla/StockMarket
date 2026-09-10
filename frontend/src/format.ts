export function formatPrice(value: number | null, currency: string | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatChange(change: number | null, changePercent: number | null): string {
  if (change === null || changePercent === null) return '—'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
}

export function changeDirection(change: number | null): 'up' | 'down' | 'flat' {
  if (change === null || change === 0) return 'flat'
  return change > 0 ? 'up' : 'down'
}
