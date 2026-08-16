# Go Logistic

App de logística para pedidos de Shopify: reportes de pedidos confirmados/cancelados/sin confirmar, y módulo de devoluciones. Para el equipo de un negocio de ecommerce (admin + logística).

## Stack

React 19 + Vite + Tailwind CSS + Supabase (Postgres + Auth + Edge Functions), desplegado en Vercel.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar con tu proyecto de Supabase
npm run dev
```

## Base de datos

Correr `supabase/schema.sql` en tu proyecto de Supabase (idempotente, seguro de correr varias veces).

Cuentas: no hay registro público. Tu cuenta (`juaneschaverra15@gmail.com`) créala una vez desde el dashboard de Supabase → Authentication → Users → Add user — se marca admin automáticamente. Desde ahí, usa el botón **Invitar** en la sección Usuarios de la app para agregar al resto del equipo (entran como rol `logistica`).

## Desplegar las Edge Functions

```bash
supabase functions deploy invite-user
supabase functions deploy shopify-webhook --no-verify-jwt
```

`invite-user` sí requiere JWT (la llama el navegador con la sesión del admin), por eso no lleva `--no-verify-jwt`.

Para que el correo de invitación redirija bien: en el dashboard de Supabase → Authentication → URL Configuration, agrega la URL de tu app (`http://localhost:5180` en desarrollo, la URL de Vercel en producción) tanto en **Site URL** como en **Redirect URLs**.

## Conectar Shopify

Ver [`SHOPIFY_SETUP.md`](./SHOPIFY_SETUP.md).
