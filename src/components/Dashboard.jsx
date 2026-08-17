import { useMemo, useState } from 'react'
import { Package, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { RANGES, withinRange } from '../lib/dateRange'
import { ORDER_STATUS, RETURN_STATUS } from '../lib/statusMeta'

const ORDER_ROWS = [
  { status: 'sin_confirmar', label: 'Sin confirmar', icon: Package, view: 'pedidos' },
  { status: 'pendiente', label: 'Pendientes', icon: Clock, view: 'pendientes' },
  { status: 'confirmada', label: 'Confirmados', icon: CheckCircle2, view: 'confirmados' },
  { status: 'cancelada', label: 'Cancelados', icon: XCircle, view: 'cancelados' },
]

export default function Dashboard({ orders, devoluciones, setView }) {
  const [range, setRange] = useState('today')

  const scoped = useMemo(
    () => orders.filter((o) => withinRange(o.shopify_created_at ?? o.created_at, range)),
    [orders, range],
  )

  const counts = useMemo(() => {
    const c = { sin_confirmar: 0, pendiente: 0, confirmada: 0, cancelada: 0 }
    scoped.forEach((o) => {
      if (c[o.status] !== undefined) c[o.status] += 1
    })
    return c
  }, [scoped])

  const maxCount = Math.max(...ORDER_ROWS.map((r) => counts[r.status]), 1)
  const total = scoped.length

  const devolucionCounts = useMemo(() => {
    const c = { pendiente: 0, aprobada: 0, rechazada: 0, completada: 0 }
    devoluciones.forEach((d) => {
      if (c[d.status] !== undefined) c[d.status] += 1
    })
    return c
  }, [devoluciones])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-(family-name:--font-display) text-2xl font-semibold text-(--text)">Vista general</h1>
      <p className="mt-1 text-sm text-(--muted)">Pedidos{total ? ` — ${total} en este período` : ''}.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              range === r.key ? 'bg-(--accent) text-white' : 'bg-(--elevated) text-(--muted)'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {ORDER_ROWS.map((row) => {
          const Icon = row.icon
          const color = ORDER_STATUS[row.status].color
          return (
            <button
              key={row.status}
              onClick={() => setView(row.view)}
              className="rounded-xl border border-(--border) bg-(--card) p-3.5 text-left transition hover:border-(--accent)"
            >
              <div
                className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
              >
                <Icon size={16} />
              </div>
              <p className="font-(family-name:--font-mono) text-2xl font-semibold text-(--text)">{counts[row.status]}</p>
              <p className="mt-0.5 text-xs text-(--muted)">{row.label}</p>
            </button>
          )
        })}
      </div>

      <div className="mt-6 rounded-xl border border-(--border) bg-(--card) p-4">
        <h2 className="mb-3 text-sm font-semibold text-(--text)">Pedidos por estado</h2>
        <div className="flex flex-col">
          {ORDER_ROWS.map((row) => (
            <BarRow
              key={row.status}
              label={row.label}
              value={counts[row.status]}
              max={maxCount}
              color={ORDER_STATUS[row.status].color}
              onClick={() => setView(row.view)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-(--text)">Devoluciones</h2>
          <button onClick={() => setView('devoluciones')} className="flex items-center gap-1 text-xs font-medium text-(--accent)">
            <RotateCcw size={12} /> Ver todas
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(RETURN_STATUS).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setView('devoluciones')}
              className="rounded-xl border border-(--border) bg-(--card) p-3.5 text-left transition hover:border-(--accent)"
            >
              <p className="font-(family-name:--font-mono) text-xl font-semibold" style={{ color: meta.color }}>
                {devolucionCounts[key] ?? 0}
              </p>
              <p className="mt-0.5 text-xs text-(--muted)">{meta.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function BarRow({ label, value, max, color, onClick }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const displayPct = value > 0 ? Math.max(pct, 4) : 0

  return (
    <button
      onClick={onClick}
      title={`${label}: ${value}`}
      className="flex w-full items-center gap-3 rounded-lg py-2 text-left transition hover:bg-(--elevated)"
    >
      <span className="w-28 shrink-0 truncate text-sm text-(--muted)">{label}</span>
      <span className="relative h-5 flex-1 overflow-hidden rounded-full bg-(--elevated)">
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${displayPct}%`, background: color }}
        />
      </span>
      <span className="w-8 shrink-0 text-right font-(family-name:--font-mono) text-sm font-semibold text-(--text)">
        {value}
      </span>
    </button>
  )
}
