# Conectar Shopify a Go Logistic

Esto conecta tu tienda de Shopify para que cada pedido nuevo aparezca automáticamente en Go Logistic con estado "Sin confirmar", listo para que tu empleada lo llame y confirme.

## 1. Desplegar la Edge Function (una sola vez)

Con la CLI de Supabase ya vinculada a tu proyecto:

```bash
supabase functions deploy shopify-webhook --no-verify-jwt
```

El flag `--no-verify-jwt` es obligatorio: Shopify no manda un JWT de Supabase, solo su propia firma (verificada dentro de la función).

Copia la URL que te devuelve, algo como:
`https://<tu-proyecto>.supabase.co/functions/v1/shopify-webhook`

## 2. Configurar los secrets de la función

```bash
supabase secrets set SHOPIFY_WEBHOOK_SECRET=tu-secret-aqui
```

(`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles automáticamente para toda Edge Function en tu proyecto — no hace falta configurarlas a mano.)

## 3. Crear la app personalizada en Shopify

1. En tu admin de Shopify: **Configuración → Apps y canales de venta → Desarrollar apps**.
2. **Crear una app** → dale un nombre, por ejemplo "Go Logistic".
3. En **Configuración de API de Admin**, activa el scope **`read_orders`** (con eso alcanza — no necesitas escribir pedidos desde aquí).
4. **Instalar app**. Copia el **token de acceso de API de Admin** (empieza con `shpat_...`) — solo se muestra una vez. Guárdalo en un lugar seguro; hoy no lo necesita el código (los webhooks no requieren este token), pero lo vas a necesitar si más adelante hacemos una importación inicial de pedidos históricos.

## 4. Registrar los webhooks

Todavía dentro de la misma app, o en **Configuración → Notificaciones → Webhooks**:

Crea 3 webhooks, todos apuntando a la URL del paso 1, formato JSON:

| Evento | Tema (topic) |
|---|---|
| Creación de pedido | `orders/create` |
| Actualización de pedido | `orders/updated` |
| Cancelación de pedido | `orders/cancelled` |

Al crear el primero, Shopify te muestra el **secret compartido del webhook** — es el mismo valor para los 3 webhooks de esta tienda. Ese es el `SHOPIFY_WEBHOOK_SECRET` del paso 2.

## 5. Probar

Crea un pedido de prueba en Shopify (puede ser un borrador marcado como pagado, o un pedido real). En unos segundos debería aparecer en Go Logistic → Pedidos con estado "Sin confirmar".

Si no aparece: revisa **Configuración → Notificaciones → Webhooks** en Shopify — cada webhook tiene un historial de entregas con el código de respuesta; un `401` significa que el secret no coincide, un `500` significa un error en la función (revisar logs con `supabase functions logs shopify-webhook`).
