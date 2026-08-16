-- Go Logistic — esquema canónico e idempotente.
-- Seguro de correr repetidas veces (create table/policy if not exists, create or replace function).

-- ============================================================
-- 1. profiles (espejo de auth.users)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'logistica' check (role in ('admin', 'logistica')),
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "select own or admin" on public.profiles;
create policy "select own or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "update own or admin" on public.profiles;
create policy "update own or admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists "insert own" on public.profiles;
create policy "insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger: crea la fila de profiles automáticamente al registrarse.
-- El correo de Juan siempre es admin; cualquier otra cuenta nueva entra como logistica
-- (solo 2 cuentas en total, creadas a mano desde el dashboard de Supabase — sin registro público).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when new.email = 'juaneschaverra15@gmail.com' then 'admin' else 'logistica' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. orders (sincronizados desde Shopify vía webhook)
-- ============================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id bigint unique not null,
  order_number text not null,
  customer_name text,
  phone text,
  address text,
  city text,
  total_amount numeric(12,2),
  currency text default 'COP',
  line_items jsonb default '[]'::jsonb,
  status text not null default 'sin_confirmar' check (status in ('sin_confirmar', 'pendiente', 'confirmada', 'cancelada')),
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  notes text,
  shopify_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migración: agrega el estado 'pendiente' si la tabla ya existía con el check anterior
-- (deja el pedido en seguimiento, en vez de forzar confirmar/cancelar de una).
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('sin_confirmar', 'pendiente', 'confirmada', 'cancelada'));

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_shopify_created_at_idx on public.orders(shopify_created_at);

alter table public.orders enable row level security;

-- Dato compartido de equipo (solo 2 cuentas, ambas del mismo negocio) — no aislado por user_id
-- como en PROGO. Cualquier cuenta autenticada y no deshabilitada puede leer/editar.
drop policy if exists "team read/write" on public.orders;
create policy "team read/write" on public.orders
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and not disabled)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and not disabled)
  );

-- El webhook de Shopify escribe con la service_role key, que se salta RLS por diseño —
-- no necesita policy propia.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. devoluciones (registradas a mano por logística)
-- ============================================================

create table if not exists public.devoluciones (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  order_reference text,
  product_description text not null,
  reason text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'rechazada', 'completada')),
  refund_amount numeric(12,2),
  notes text,
  created_by uuid references public.profiles(id),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devoluciones_status_idx on public.devoluciones(status);

alter table public.devoluciones enable row level security;

drop policy if exists "team read/write" on public.devoluciones;
create policy "team read/write" on public.devoluciones
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and not disabled)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and not disabled)
  );

drop trigger if exists devoluciones_set_updated_at on public.devoluciones;
create trigger devoluciones_set_updated_at
  before update on public.devoluciones
  for each row execute function public.set_updated_at();
