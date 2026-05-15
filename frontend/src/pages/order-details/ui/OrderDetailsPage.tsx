import { useParams } from "react-router-dom"

import { useOrder } from "@/entities/order/api/useOrders"
import { pickupPoints } from "@/shared/api/mock-db"
import { routes } from "@/shared/config/routes"
import { formatDate, formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { MapView } from "@/shared/ui/map/MapView"
import { OrderTimeline } from "@/widgets/order-timeline/ui/OrderTimeline"

export const OrderDetailsPage = () => {
  const { id = "" } = useParams()
  const { data: order, isLoading } = useOrder(id)

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-4">
        <PageHeader title="Заказ не найден" backTo={routes.orders} />
      </div>
    )
  }

  const pickup = pickupPoints.find((p) => p.id === order.pickupPointId)
  const markers = pickup
    ? [
        {
          id: pickup.id,
          title: pickup.name,
          coordinates: pickup.coordinates,
          type: "pickup" as const,
          description: pickup.address,
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title={`Заказ № ${order.id}`}
        backTo={routes.orders}
        action={
          <Badge variant={orderStatusVariant[order.status]}>
            {orderStatusLabel[order.status]}
          </Badge>
        }
      />

      <Card>
        <p className="text-xs text-slate-500">Создан</p>
        <p className="font-medium text-slate-900">{formatDate(order.createdAt)}</p>
        <p className="mt-2 text-lg font-bold text-blue-700">{formatPrice(order.total)}</p>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Статус доставки</h2>
        <OrderTimeline timeline={order.timeline} />
      </Card>

      <MapView
        title="Пункт выдачи"
        markers={markers}
        height="200px"
      />

      {pickup ? (
        <Card>
          <p className="text-sm font-semibold text-slate-800">{pickup.name}</p>
          <p className="text-sm text-slate-600">{pickup.address}</p>
          <p className="mt-1 text-xs text-slate-500">
            Координатор: {pickup.coordinatorName}, {pickup.coordinatorPhone}
          </p>
        </Card>
      ) : null}
    </div>
  )
}
