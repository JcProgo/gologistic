export const RANGES = [
  { key: 'today', label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'all', label: 'Todo' },
  { key: 'custom', label: 'Personalizado' },
]

function isSameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function withinRange(iso, rangeKey, customRange) {
  if (!iso) return false
  if (rangeKey === 'all') return true

  const date = new Date(iso)

  if (rangeKey === 'custom') {
    const { start, end } = customRange ?? {}
    if (!start && !end) return true
    if (start && date < new Date(`${start}T00:00:00`)) return false
    if (end && date > new Date(`${end}T23:59:59`)) return false
    return true
  }

  const now = new Date()
  if (rangeKey === 'today') return isSameLocalDay(date, now)
  if (rangeKey === 'yesterday') {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return isSameLocalDay(date, yesterday)
  }
  const days = rangeKey === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
}
