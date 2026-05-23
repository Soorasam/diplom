import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { MessageSquare, QrCode } from "lucide-react"

import { useOrder } from "@/entities/order/api/useOrders"
import { usePickupPoints } from "@/entities/settlement/api/useSettlements"
import { useAuthStore } from "@/app/model/auth-store"
import { routes } from "@/shared/config/routes"
import { formatDate, formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { MapView } from "@/shared/ui/map/MapView"
import { OrderTimeline } from "@/widgets/order-timeline/ui/OrderTimeline"

export const OrderDetailsPage = () => {
  const { id = "" } = useParams()
  const user = useAuthStore((s) => s.user)
  const { data: order, isLoading } = useOrder(id)
  const { data: pickupPoints } = usePickupPoints(user?.settlementId)
  const [qrOpen, setQrOpen] = useState(false)

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

  const pickup = pickupPoints?.find((p) => p.id === order.pickupPointId)
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

  const showQr = order.status === "at_pickup"
  const canDispute =
    order.status !== "cancelled" && order.status !== "draft"

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title={`Заказ #${order.id.slice(0, 8)}`}
        backTo={routes.orders}
        subtitle={formatDate(order.createdAt)}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {formatPrice(order.total)}
        </span>
        <Badge variant={orderStatusVariant[order.status]}>
          {orderStatusLabel[order.status]}
        </Badge>
      </div>

      {pickup ? (
        <Card>
          <p className="text-sm font-semibold text-slate-900">Пункт выдачи</p>
          <p className="mt-1 text-sm text-slate-600">{pickup.name}</p>
          <p className="text-xs text-slate-500">{pickup.address}</p>
          {pickup.coordinatorName ? (
            <p className="mt-2 text-xs text-slate-500">
              Координатор: {pickup.coordinatorName}
              {pickup.coordinatorPhone ? ` · ${pickup.coordinatorPhone}` : ""}
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <p className="mb-2 text-sm font-semibold text-slate-900">Состав</p>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between text-sm">
              <span className="text-slate-700">
                {item.productName ?? item.productId} × {item.quantity}
              </span>
              <span className="font-medium text-slate-900">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-900">История статусов</p>
        <OrderTimeline timeline={order.timeline} />
      </Card>

      {(showQr || canDispute) && (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-900">Действия</p>
          {showQr ? (
            <Button
              type="button"
              variant="outline"
              fullWidth
              leftIcon={<QrCode size={18} />}
              onClick={() => setQrOpen(true)}
            >
              Показать QR для выдачи
            </Button>
          ) : null}
          {canDispute ? (
            <Link
              to={routes.disputeCreate(order.id)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200"
            >
              <MessageSquare size={18} />
              Открыть спор
            </Link>
          ) : null}
        </Card>
      )}

      {markers.length > 0 ? (
        <Card>
          <p className="mb-2 text-sm font-semibold text-slate-900">На карте</p>
          <MapView markers={markers} className="h-48" />
        </Card>
      ) : null}

      {qrOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setQrOpen(false)}
        >
          <Card
            className="ornament-frame max-w-xs text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-slate-900">QR-код заказа</p>
            <p className="mt-1 text-xs text-slate-500">Покажите сотруднику ПВЗ</p>
            <div className="relative z-10 mx-auto mt-4 flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 font-mono text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {order.id}
            </div>
            <Button className="mt-4" fullWidth onClick={() => setQrOpen(false)}>
              Закрыть
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
