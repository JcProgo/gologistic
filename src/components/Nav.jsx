import { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  LogOut,
  Sun,
  Moon,
  Crown,
  Menu,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const PRIMARY = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'pedidos', label: 'Pedidos', icon: Package },
  { key: 'devoluciones', label: 'Devoluciones', icon: RotateCcw },
]

const SECONDARY = [
  { key: 'pendientes', label: 'Pendientes', icon: Clock },
  { key: 'confirmados', label: 'Confirmados', icon: CheckCircle2 },
  { key: 'cancelados', label: 'Cancelados', icon: XCircle },
]

const ADMIN_ONLY = { key: 'usuarios', label: 'Usuarios', icon: Users }

export default function Nav({ view, setView, profile, mode, setMode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const secondary = profile.role === 'admin' ? [...SECONDARY, ADMIN_ONLY] : SECONDARY
  const allItems = [...PRIMARY, ...secondary]

  function go(key) {
    setView(key)
    setDrawerOpen(false)
  }

  return (
    <>
      {/* Sidebar — escritorio */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-(--border) bg-(--card) p-4 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent)/15 text-(--accent)">
            <Package size={16} strokeWidth={2.5} />
          </div>
          <span className="font-(family-name:--font-display) font-semibold text-(--text)">
            Go Logistic
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {allItems.map((item) => (
            <NavButton key={item.key} item={item} active={view === item.key} onClick={() => go(item.key)} />
          ))}
        </nav>

        <div className="flex items-center justify-between border-t border-(--border) pt-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-(--text)">{profile.email}</p>
            {profile.role === 'admin' ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--gold)' }}>
                <Crown size={11} /> Fundador
              </p>
            ) : (
              <p className="text-xs text-(--muted)">Logística</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-(--muted) hover:bg-(--elevated)"
              aria-label="Cambiar tema"
            >
              {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="rounded-lg p-2 text-(--muted) hover:bg-(--elevated)"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Barra superior — móvil */}
      <div className="flex items-center justify-between border-b border-(--border) bg-(--card) px-4 py-3 md:hidden">
        <span className="font-(family-name:--font-display) font-semibold text-(--text)">Go Logistic</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-(--muted)"
            aria-label="Cambiar tema"
          >
            {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="rounded-lg p-2 text-(--muted)" aria-label="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Cápsula inferior — móvil */}
      <nav className="fixed inset-x-4 bottom-4 z-10 flex items-center justify-around rounded-2xl border border-(--border) bg-(--card)/90 p-1.5 shadow-lg shadow-black/10 backdrop-blur md:hidden">
        {PRIMARY.map((item) => {
          const Icon = item.icon
          const active = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
                active ? 'bg-(--accent)/15 text-(--accent)' : 'text-(--muted)'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition ${
            secondary.some((s) => s.key === view) ? 'bg-(--accent)/15 text-(--accent)' : 'text-(--muted)'
          }`}
        >
          <Menu size={18} />
          Más
        </button>
      </nav>

      {/* Drawer "Más" — móvil */}
      {drawerOpen && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 md:hidden" onClick={() => setDrawerOpen(false)}>
          <div
            className="w-full rounded-t-2xl bg-(--card) p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-(--text)">Más</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 text-(--muted) hover:bg-(--elevated)">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {secondary.map((item) => (
                <NavButton key={item.key} item={item} active={view === item.key} onClick={() => go(item.key)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active ? 'bg-(--accent)/15 text-(--accent)' : 'text-(--muted) hover:bg-(--elevated) hover:text-(--text)'
      }`}
    >
      <Icon size={17} />
      {item.label}
    </button>
  )
}
