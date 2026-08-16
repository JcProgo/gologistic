// Edge Function: invita a un nuevo usuario por correo. Solo un admin puede llamarla.
// Desplegar SIN --no-verify-jwt: la llama el navegador con la sesión del admin, y el
// gateway ya valida que el JWT sea válido antes de que el código corra; dentro además
// verificamos explícitamente que el rol sea 'admin' antes de invitar a nadie.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Falta autorización' }), { status: 401 })
  }

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser()

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401 })
  }

  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Solo un administrador puede invitar usuarios' }), {
      status: 403,
    })
  }

  let body: { email?: string; redirectTo?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Correo inválido' }), { status: 400 })
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: body.redirectTo,
  })

  if (inviteError) {
    return new Response(JSON.stringify({ error: inviteError.message }), { status: 400 })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
