import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { RETURN_STATUS } from '../lib/statusMeta'
import { formatCOP, formatDateTime } from '../lib/formatters'

const FILTERS = ['todos', 'pendiente', 'aprobada', 'rechazada', 'completada']

export default function Devoluciones({ devoluciones, insertDevolucion, patchDevolucion, profile }) {
  const [filter, setFilter] = useState('todos')
  const [showForm, setShowForm] = useState(false)

  const filtered = useMemo(
    () =>
      devoluciones
        .filter((d) => filter === 'todos' || d.status === filter)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [devoluciones, filter],
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-(family-name:--font-display) text-2xl font-semibold text-(--text)">Devoluciones</h1>
          <p className="mt-1 text-sm text-(--muted)">Registra y da seguimiento a las devoluciones.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-(--accent) px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> Nueva
        </button>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              filter === f ? 'bg-(--accent) text-white' : 'bg-(--elevated) text-(--muted)'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 pb-24 md:pb-4">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-(--muted)">No hay devoluciones en este filtro.</p>
        )}
        {filtered.map((d) => (
          <ReturnRow key={d.id} devolucion={d} patchDevolucion={patchDevolucion} profile={profile} />
        ))}
      </div>

      {showForm && (
        <NewReturnModal
          onClose={() => setShowForm(false)}
          onCreate={async (payload) => {
            await insertDevolucion({ ...payload, created_by: profile.id })
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function ReturnRow({ devolucion, patchDevolucion, profile }) {
  const meta = RETURN_STATUS[devolucion.status]

  return (
    <div className="rounded-xl border border-(--border) bg-(--card) p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-(--text)">
              {devolucion.order_reference || (devolucion.order_id ? `Pedido ${devolucion.order_id.slice(0, 8)}` : 'Sin referencia')}
            </span>
            <StatusBadge meta={meta} />
          </div>
          <p className="mt-1 text-sm text-(--text)">{devolucion.product_description}</p>
          <p className="mt-0.5 text-sm text-(--muted)">{devolucion.reason}</p>
        </div>
        {devolucion.refund_amount != null && (
          <span className="shrink-0 font-(family-name:--font-mono) text-sm text-(--text)">{formatCOP(devolucion.refund_amount)}</span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-(--muted)">{formatDateTime(devolucion.created_at)}</span>
        {devolucion.status !== 'completada' && devolucion.status !== 'rechazada' && (
          <div className="flex gap-1.5">
            {devolucion.status === 'pendiente' && (
              <>
                <StatusActionButton label="Aprobar" color="var(--confirmada)" onClick={() => patchDevolucion(devolucion.id, { status: 'aprobada', resolved_by: profile.id, resolved_at: new Date().toISOString() })} />
                <StatusActionButton label="Rechazar" color="var(--cancelada)" onClick={() => patchDevolucion(devolucion.id, { status: 'rechazada', resolved_by: profile.id, resolved_at: new Date().toISOString() })} />
              </>
            )}
            {devolucion.status === 'aprobada' && (
              <StatusActionButton label="Marcar completada" color="var(--accent)" onClick={() => patchDevolucion(devolucion.id, { status: 'completada', resolved_by: profile.id, resolved_at: new Date().toISOString() })} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusActionButton({ label, color, onClick }) {
  return (
    <button onClick={onClick} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white" style={{ background: color }}>
      {label}
    </button>
  )
}

function NewReturnModal({ onClose, onCreate }) {
  const [orderReference, setOrderReference] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [reason, setReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onCreate({
      order_reference: orderReference.trim() || null,
      product_description: productDescription.trim(),
      reason: reason.trim(),
      refund_amount: refundAmount ? Number(refundAmount) : null,
      notes: notes.trim() || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-(--card) p-5 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-(family-name:--font-display) text-lg font-semibold text-(--text)">Nueva devolución</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-(--muted) hover:bg-(--elevated)">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field label="Referencia del pedido (opcional)">
            <input value={orderReference} onChange={(e) => setOrderReference(e.target.value)} className="input" placeholder="# de pedido o nombre del cliente" />
          </Field>
          <Field label="Producto">
            <input required value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="input" placeholder="Ej. Camiseta talla M" />
          </Field>
          <Field label="Motivo">
            <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="input" placeholder="Ej. Talla incorrecta" />
          </Field>
          <Field label="Monto a reembolsar (opcional)">
            <input type="number" min="0" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="input" placeholder="0" />
          </Field>
          <Field label="Notas (opcional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-lg bg-(--accent) py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Registrar devolución'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-(--muted)">{label}</span>
      {children}
    </label>
  )
}
