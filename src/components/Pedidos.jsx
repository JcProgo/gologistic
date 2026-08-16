import { Check, X, Clock } from 'lucide-react'
import OrdersBoard from './OrdersBoard'

const ACTIONS = [
  { key: 'confirmar', label: 'Confirmar', icon: Check, color: 'var(--confirmada)', targetStatus: 'confirmada' },
  { key: 'pendiente', label: 'Pendiente', icon: Clock, color: 'var(--pendiente)', targetStatus: 'pendiente' },
  { key: 'cancelar', label: 'Cancelar', icon: X, color: 'var(--cancelada)', targetStatus: 'cancelada' },
]

export default function Pedidos({ orders, patchOrder, profile }) {
  return (
    <OrdersBoard
      title="Pedidos"
      subtitle="Pedidos nuevos de Shopify, listos para llamar y confirmar."
      orders={orders}
      statuses={['sin_confirmar']}
      actions={ACTIONS}
      patchOrder={patchOrder}
      profile={profile}
    />
  )
}
