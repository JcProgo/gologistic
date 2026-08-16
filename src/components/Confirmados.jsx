import OrdersBoard from './OrdersBoard'

export default function Confirmados({ orders, patchOrder, profile }) {
  return (
    <OrdersBoard
      title="Confirmados"
      subtitle="Pedidos ya confirmados con el cliente, listos para despachar."
      orders={orders}
      statuses={['confirmada']}
      actions={[]}
      patchOrder={patchOrder}
      profile={profile}
    />
  )
}
