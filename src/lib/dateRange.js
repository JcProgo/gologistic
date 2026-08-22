export const RANGES = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'all', label: 'Todo' },
  { key: 'custom', label: 'Personalizado' },
]

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
  if (rangeKey === 'today') {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  }
  const days = rangeKey === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
}
