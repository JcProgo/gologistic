import { useMemo, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import StatusBadge from './StatusBadge'
import RangePicker from './RangePicker'
import { ORDER_STATUS } from '../lib/statusMeta'
import { formatCOP, formatDateTime } from '../lib/formatters'
import { withinRange } from '../lib/dateRange'

export default function OrdersBoard({ title, subtitle, orders, statuses, actions = [], patchOrder, profile, defaultRange = 'today' }) {
  const [range, setRange] = useState(defaultRange)
  const [customRange, setCustomRange] = useState({ start: '', end: '' })
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders
      .filter((o) => statuses.includes(o.status))
      .filter((o) => withinRange(o.shopify_created_at ?? o.created_at, range, customRange))
      .filter(
        (o) =>
          !q ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.order_number?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q),
      )
      .sort((a, b) => new Date(b.shopify_created_at ?? b.created_at) - new Date(a.shopify_created_at ?? a.created_at))
  }, [orders, statuses, range, customRange, search])

  function applyAction(order, action, notes) {
    patchOrder(order.id, {
      status: action.targetStatus,
      notes,
      confirmed_by: profile.id,
      confirmed_at: new Date().toISOString(),
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-(family-name:--font-display) text-2xl font-semibold text-(--text)">{title}</h1>
      <p className="mt-1 text-sm text-(--muted)">{subtitle}</p>

      <div className="mt-5">
        <RangePicker range={range} setRange={setRange} customRange={customRange} setCustomRange={setCustomRange} />
      </div>

      <div className="relative mt-4">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--muted)" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, # de pedido o teléfono"
          className="w-full rounded-lg border border-(--border) bg-(--card) py-2.5 pl-9 pr-3 text-sm text-(--text) outline-none focus:border-(--accent)"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 pb-24 md:pb-4">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-(--muted)">No hay pedidos en este filtro.</p>
        )}
        {filtered.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            actions={actions}
            expanded={expandedId === order.id}
            onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
            onAction={(action, notes) => applyAction(order, action, notes)}
          />
        ))}
      </div>
    </div>
  )
}

function OrderRow({ order, actions, expanded, onToggle, onAction }) {
  const [note, setNote] = useState(order.notes ?? '')
  const meta = ORDER_STATUS[order.status]

  return (
    <div className="rounded-xl border border-(--border) bg-(--card) p-3.5">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-(family-name:--font-mono) text-sm font-semibold text-(--text)">#{order.order_number}</span>
            <StatusBadge meta={meta} />
          </div>
          <p className="mt-1 truncate text-sm text-(--muted)">{order.customer_name || 'Sin nombre'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-(family-name:--font-mono) text-sm text-(--text)">{formatCOP(order.total_amount)}</span>
          <ChevronDown size={16} className={`text-(--muted) transition ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="mt-3 border-t border-(--border) pt-3 text-sm">
          <dl className="grid grid-cols-2 gap-y-1.5 text-(--muted)">
            <dt>Teléfono</dt>
            <dd className="text-right text-(--text)">{order.phone || '—'}</dd>
            <dt>Dirección</dt>
            <dd className="text-right text-(--text)">{order.address || '—'}{order.city ? `, ${order.city}` : ''}</dd>
            <dt>Fecha Shopify</dt>
            <dd className="text-right text-(--text)">{formatDateTime(order.shopify_created_at)}</dd>
          </dl>

          {order.line_items?.length > 0 && (
            <ul className="mt-2 space-y-1 text-(--text)">
              {order.line_items.map((li, i) => (
                <li key={i} className="flex justify-between">
                  <span>{li.quantity}× {li.title}</span>
                  <span className="text-(--muted)">{formatCOP(li.price)}</span>
                </li>
              ))}
            </ul>
          )}

          {actions.length > 0 && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota (opcional)"
              rows={2}
              className="mt-3 w-full rounded-lg border border-(--border) bg-(--elevated) p-2 text-sm text-(--text) outline-none focus:border-(--accent)"
            />
          )}

          {actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.key}
                    onClick={() => onAction(action, note)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: action.color }}
                  >
                    <Icon size={15} /> {action.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
