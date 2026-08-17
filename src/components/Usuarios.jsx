import { useState } from 'react'
import { Crown, Truck, Plus, X, Loader2, Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Usuarios({ profiles, refetchProfiles }) {
  const [showInvite, setShowInvite] = useState(false)

  async function toggleDisabled(profile) {
    await supabase.from('profiles').update({ disabled: !profile.disabled }).eq('id', profile.id)
    refetchProfiles()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-(family-name:--font-display) text-2xl font-semibold text-(--text)">Equipo</h1>
          <p className="mt-1 text-sm text-(--muted)">
            {profiles.length} {profiles.length === 1 ? 'persona' : 'personas'} con acceso a Go Logistic.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-(--accent) px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={15} /> Invitar
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-(--border) bg-(--card) p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: p.role === 'admin' ? 'color-mix(in srgb, var(--gold) 15%, transparent)' : 'color-mix(in srgb, var(--accent) 15%, transparent)',
                  color: p.role === 'admin' ? 'var(--gold)' : 'var(--accent)',
                }}
              >
                {p.role === 'admin' ? <Crown size={17} /> : <Truck size={17} />}
              </div>
              <div>
                <p className="text-sm font-medium text-(--text)">{p.email}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {p.role === 'admin' ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)' }}
                    >
                      Fundador
                    </span>
                  ) : (
                    <span className="text-xs text-(--muted)">Logística</span>
                  )}
                  {p.disabled && (
                    <span className="text-xs text-(--cancelada)">· Desactivada</span>
                  )}
                </div>
              </div>
            </div>
            {p.role !== 'admin' && (
              <button
                onClick={() => toggleDisabled(p)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                style={{ background: p.disabled ? 'var(--confirmada)' : 'var(--cancelada)' }}
              >
                {p.disabled ? 'Activar' : 'Desactivar'}
              </button>
            )}
          </div>
        ))}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={refetchProfiles} />}
    </div>
  )
}

function InviteModal({ onClose, onInvited }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: invokeError } = await supabase.functions.invoke('invite-user', {
      body: { email: email.trim(), redirectTo: window.location.origin },
    })

    setLoading(false)

    if (invokeError || data?.error) {
      let message = data?.error || invokeError?.message || 'No se pudo enviar la invitación.'
      if (invokeError?.context?.json) {
        try {
          const body = await invokeError.context.json()
          if (body?.error) message = body.error
        } catch {
          // el cuerpo de la respuesta no era JSON, nos quedamos con el mensaje que ya teníamos
        }
      }
      setError(message)
      return
    }

    setSent(true)
    onInvited()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl bg-(--card) p-6 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-(family-name:--font-display) text-lg font-semibold text-(--text)">
            Invitar a Go Logistic
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-(--muted) hover:bg-(--elevated)">
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="mt-5 flex flex-col items-center gap-3 py-4 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'color-mix(in srgb, var(--confirmada) 15%, transparent)', color: 'var(--confirmada)' }}
            >
              <Check size={22} />
            </div>
            <p className="text-sm text-(--text)">
              Invitación enviada a <span className="font-medium">{email}</span>. Va a recibir un correo para crear su contraseña.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg bg-(--accent) px-4 py-2 text-sm font-semibold text-white"
            >
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-(--muted)">
              Le llega un correo con un enlace para que cree su propia contraseña. Entra automáticamente como rol Logística.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-(--muted)">Correo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="empleada@ejemplo.com"
              />
            </label>

            {error && <p className="text-sm text-(--cancelada)">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-(--accent) py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Enviar invitación
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
