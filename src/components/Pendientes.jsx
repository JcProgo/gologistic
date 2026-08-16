import { Check, X } from 'lucide-react'
import OrdersBoard from './OrdersBoard'

const ACTIONS = [
  { key: 'confirmar', label: 'Confirmar', icon: Check, color: 'var(--confirmada)', targetStatus: 'confirmada' },
  { key: 'cancelar', label: 'Cancelar', icon: X, color: 'var(--cancelada)', targetStatus: 'cancelada' },
]

export default function Pendientes({ orders, patchOrder, profile }) {
  return (
    <OrdersBoard
      title="Pendientes"
      subtitle="Pedidos en seguimiento — todavía no se pudieron confirmar ni cancelar."
      orders={orders}
      statuses={['pendiente']}
      actions={ACTIONS}
      patchOrder={patchOrder}
      profile={profile}
      defaultRange="all"
    />
  )
}
