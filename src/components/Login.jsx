import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Logo from './Logo'

export default function Login({ mode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError) {
      if (signInError.code === 'email_not_confirmed') {
        setError('Tu correo no está confirmado todavía. Pídele al administrador que confirme tu cuenta desde Supabase.')
      } else {
        setError('Correo o contraseña incorrectos.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink) px-4">
      <div className="w-full max-w-sm rounded-2xl border border-(--border) bg-(--card) p-8 shadow-xl shadow-black/5">
        <div className="mb-6">
          <Logo mode={mode} size="lg" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--muted)">
              Correo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-(--border) bg-(--elevated) px-3 py-2.5 text-(--text) outline-none focus:border-(--accent)"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--muted)">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-(--border) bg-(--elevated) px-3 py-2.5 text-(--text) outline-none focus:border-(--accent)"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-(--cancelada)">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-(--accent) py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-(--muted)">
          Acceso solo por invitación. Si no tienes cuenta, pídele a tu administrador que la cree.
        </p>
      </div>
    </div>
  )
}
