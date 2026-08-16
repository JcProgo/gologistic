import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'
import Login from './components/Login'
import SetPassword from './components/SetPassword'
import Nav from './components/Nav'
import Dashboard from './components/Dashboard'
import Pedidos from './components/Pedidos'
import Pendientes from './components/Pendientes'
import Confirmados from './components/Confirmados'
import Cancelados from './components/Cancelados'
import Devoluciones from './components/Devoluciones'
import Usuarios from './components/Usuarios'

function useMode() {
  const [mode, setMode] = useState(() => localStorage.getItem('go-logistic-mode') || 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    localStorage.setItem('go-logistic-mode', mode)
  }, [mode])

  return [mode, setMode]
}

function usePendingAuthFlow() {
  const [pending, setPending] = useState(() => {
    const hash = window.location.hash
    return hash.includes('type=invite') || hash.includes('type=recovery')
  })
  return [pending, setPending]
}

export default function App() {
  const [mode, setMode] = useMode()
  const [pendingAuthFlow, setPendingAuthFlow] = usePendingAuthFlow()
  const [authLoading, setAuthLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [view, setView] = useState('dashboard')

  const [orders, setOrders] = useState([])
  const [devoluciones, setDevoluciones] = useState([])
  const [profiles, setProfiles] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setProfileLoading(false)
      })
  }, [session])

  async function loadData() {
    setDataLoading(true)
    const [ordersRes, devolucionesRes, profilesRes] = await Promise.all([
      supabase.from('orders').select('*').order('shopify_created_at', { ascending: false }),
      supabase.from('devoluciones').select('*').order('created_at', { ascending: false }),
      profile?.role === 'admin' ? supabase.from('profiles').select('*').order('created_at') : Promise.resolve({ data: [] }),
    ])
    setOrders(ordersRes.data ?? [])
    setDevoluciones(devolucionesRes.data ?? [])
    setProfiles(profilesRes.data ?? [])
    setDataLoading(false)
  }

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  async function patchOrder(id, patch) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
    await supabase.from('orders').update(patch).eq('id', id)
  }

  async function insertDevolucion(payload) {
    const { data } = await supabase.from('devoluciones').insert(payload).select().single()
    if (data) setDevoluciones((prev) => [data, ...prev])
  }

  async function patchDevolucion(id, patch) {
    setDevoluciones((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    await supabase.from('devoluciones').update(patch).eq('id', id)
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--ink) px-4 text-center">
        <p className="max-w-sm text-sm text-(--muted)">
          Falta configurar <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en <code>.env</code>.
        </p>
      </div>
    )
  }

  if (authLoading) return <FullscreenSpinner />

  if (pendingAuthFlow) {
    if (!session) return <FullscreenSpinner />
    return (
      <SetPassword
        onDone={() => {
          window.history.replaceState(null, '', window.location.pathname)
          setPendingAuthFlow(false)
        }}
      />
    )
  }

  if (!session) return <Login />
  if (profileLoading || !profile) return <FullscreenSpinner />

  return (
    <div className="flex min-h-screen flex-col bg-(--ink) md:flex-row">
      <Nav view={view} setView={setView} profile={profile} mode={mode} setMode={setMode} />
      <main className="flex-1">
        {dataLoading ? (
          <FullscreenSpinner />
        ) : (
          <>
            {view === 'dashboard' && <Dashboard orders={orders} devoluciones={devoluciones} setView={setView} />}
            {view === 'pedidos' && <Pedidos orders={orders} patchOrder={patchOrder} profile={profile} />}
            {view === 'pendientes' && <Pendientes orders={orders} patchOrder={patchOrder} profile={profile} />}
            {view === 'confirmados' && <Confirmados orders={orders} patchOrder={patchOrder} profile={profile} />}
            {view === 'cancelados' && <Cancelados orders={orders} patchOrder={patchOrder} profile={profile} />}
            {view === 'devoluciones' && (
              <Devoluciones
                devoluciones={devoluciones}
                insertDevolucion={insertDevolucion}
                patchDevolucion={patchDevolucion}
                profile={profile}
              />
            )}
            {view === 'usuarios' && profile.role === 'admin' && (
              <Usuarios profiles={profiles} refetchProfiles={loadData} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

function FullscreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink)">
      <Loader2 size={24} className="animate-spin text-(--accent)" />
    </div>
  )
}
