import OrdersBoard from './OrdersBoard'

export default function Cancelados({ orders, patchOrder, profile }) {
  return (
    <OrdersBoard
      title="Cancelados"
      subtitle="Pedidos que el cliente canceló o no confirmó."
      orders={orders}
      statuses={['cancelada']}
      actions={[]}
      patchOrder={patchOrder}
      profile={profile}
    />
  )
}
