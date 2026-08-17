import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Logo from './Logo'

export default function SetPassword({ mode, onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('No se pudo guardar la contraseña. Pide un nuevo enlace de invitación.')
      return
    }
    onDone()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink) px-4">
      <div className="w-full max-w-sm rounded-2xl border border-(--border) bg-(--card) p-8 shadow-xl shadow-black/5">
        <div className="mb-6">
          <Logo mode={mode} size="lg" />
        </div>

        <p className="mb-5 text-sm text-(--muted)">Crea tu contraseña para activar tu cuenta.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--muted)">Nueva contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-(--border) bg-(--elevated) px-3 py-2.5 text-(--text) outline-none focus:border-(--accent)"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--muted)">Confirmar contraseña</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-(--border) bg-(--elevated) px-3 py-2.5 text-(--text) outline-none focus:border-(--accent)"
            />
          </div>

          {error && <p className="text-sm text-(--cancelada)">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-(--accent) py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Activar cuenta
          </button>
        </form>
      </div>
    </div>
  )
}
