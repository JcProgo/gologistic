// Edge Function: recibe webhooks de Shopify (orders/create, orders/updated, orders/cancelled)
// y sincroniza la tabla `orders`. Desplegar con `--no-verify-jwt` (Shopify no manda JWT de
// Supabase, solo su propia firma HMAC, verificada abajo) — ver SHOPIFY_SETUP.md.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SHOPIFY_WEBHOOK_SECRET = Deno.env.get('SHOPIFY_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function verifyHmac(rawBody: string, hmacHeader: string | null): Promise<boolean> {
  if (!hmacHeader) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SHOPIFY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return computed === hmacHeader
}

function mapLineItems(shopifyLineItems: unknown[]) {
  return (shopifyLineItems ?? []).map((li: any) => ({
    title: li.title,
    quantity: li.quantity,
    price: Number(li.price),
  }))
}

Deno.serve(async (req) => {
  const rawBody = await req.text()
  const hmacHeader = req.headers.get('X-Shopify-Hmac-Sha256')
  const topic = req.headers.get('X-Shopify-Topic')

  const valid = await verifyHmac(rawBody, hmacHeader)
  if (!valid) {
    return new Response('Invalid HMAC', { status: 401 })
  }

  const payload = JSON.parse(rawBody)

  if (topic === 'orders/cancelled') {
    await supabase
      .from('orders')
      .update({ status: 'cancelada' })
      .eq('shopify_order_id', payload.id)
    return new Response('ok', { status: 200 })
  }

  if (topic === 'orders/create' || topic === 'orders/updated') {
    const shippingAddress = payload.shipping_address ?? {}
    const existing = await supabase
      .from('orders')
      .select('id, status')
      .eq('shopify_order_id', payload.id)
      .maybeSingle()

    const base = {
      shopify_order_id: payload.id,
      order_number: String(payload.order_number ?? payload.name ?? payload.id),
      customer_name: [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(' ') || shippingAddress.name || null,
      phone: payload.phone ?? shippingAddress.phone ?? payload.customer?.phone ?? null,
      address: [shippingAddress.address1, shippingAddress.address2].filter(Boolean).join(' ') || null,
      city: shippingAddress.city ?? null,
      total_amount: payload.total_price ? Number(payload.total_price) : null,
      currency: payload.currency ?? 'COP',
      line_items: mapLineItems(payload.line_items),
      shopify_created_at: payload.created_at,
    }

    if (topic === 'orders/create' || !existing.data) {
      await supabase.from('orders').upsert(
        { ...base, status: 'sin_confirmar' },
        { onConflict: 'shopify_order_id' },
      )
    } else {
      // orders/updated en un pedido ya existente: no pisar un status que logística ya confirmó/canceló a mano.
      await supabase.from('orders').update(base).eq('shopify_order_id', payload.id)
    }

    return new Response('ok', { status: 200 })
  }

  return new Response('ignored', { status: 200 })
})
