export const RANGES = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'all', label: 'Todo' },
]

export function withinRange(iso, rangeKey) {
  if (!iso) return false
  if (rangeKey === 'all') return true
  const date = new Date(iso)
  const now = new Date()
  const days = rangeKey === 'today' ? 1 : rangeKey === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  if (rangeKey === 'today') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  }
  return date >= cutoff
}
