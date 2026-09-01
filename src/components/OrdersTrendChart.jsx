import { useMemo, useRef, useState } from 'react'

function hourLabel(hour) {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric' }).format(d)
}

function buildHourlyBuckets(orders) {
  const now = new Date()
  const buckets = Array.from({ length: 24 }, (_, h) => ({ key: h, label: hourLabel(h), value: 0 }))
  orders.forEach((o) => {
    const d = new Date(o.shopify_created_at ?? o.created_at)
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
      buckets[d.getHours()].value += 1
    }
  })
  return buckets
}

function smoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2
    const yc = (points[i].y + points[i + 1].y) / 2
    d += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`
  }
  const last = points[points.length - 1]
  const secondLast = points[points.length - 2]
  d += ` Q ${secondLast.x},${secondLast.y} ${last.x},${last.y}`
  return d
}

const WIDTH = 600
const HEIGHT = 180
const PAD_TOP = 16
const PAD_BOTTOM = 8
const PAD_X = 6

export default function OrdersTrendChart({ orders }) {
  const buckets = useMemo(() => buildHourlyBuckets(orders), [orders])
  const [hoverIndex, setHoverIndex] = useState(null)
  const svgRef = useRef(null)

  const innerW = WIDTH - PAD_X * 2
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM
  const max = Math.max(...buckets.map((b) => b.value), 1)

  const points = buckets.map((b, i) => ({
    ...b,
    x: PAD_X + (i / (buckets.length - 1)) * innerW,
    y: PAD_TOP + innerH - (b.value / max) * innerH,
  }))

  const linePath = smoothPath(points)
  const baseline = PAD_TOP + innerH
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x},${baseline} L ${points[0].x},${baseline} Z`
    : ''

  const total = buckets.reduce((s, b) => s + b.value, 0)
  const active = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1]

  function pointFromClientX(clientX) {
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * WIDTH
    let nearest = 0
    let minDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x)
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  return (
    <div className="mt-6 rounded-xl border border-(--border) bg-(--card) p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-(--text)">Pedidos hoy en tiempo real</h2>
          <p className="mt-1 font-(family-name:--font-mono) text-2xl font-semibold text-(--text)">{total}</p>
        </div>
        {active && (
          <div className="text-right">
            <p className="font-(family-name:--font-mono) text-sm font-semibold text-(--accent)">{active.value}</p>
            <p className="text-xs text-(--muted)">{active.label}</p>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-3 h-36 w-full touch-none"
        onMouseMove={(e) => pointFromClientX(e.clientX)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={(e) => pointFromClientX(e.touches[0].clientX)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={PAD_X} y1={baseline} x2={WIDTH - PAD_X} y2={baseline} stroke="var(--border)" strokeWidth="1" />

        {areaPath && <path d={areaPath} fill="url(#trendFill)" />}
        {linePath && <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

        {hoverIndex !== null && points[hoverIndex] && (
          <line
            x1={points[hoverIndex].x}
            y1={PAD_TOP}
            x2={points[hoverIndex].x}
            y2={baseline}
            stroke="var(--muted)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {points.map(
          (p, i) =>
            (i === hoverIndex || (hoverIndex === null && i === points.length - 1)) && (
              <circle key={p.key} cx={p.x} cy={p.y} r="4.5" fill="var(--accent)" stroke="var(--card)" strokeWidth="2" />
            ),
        )}
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-(--muted)">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  )
}
