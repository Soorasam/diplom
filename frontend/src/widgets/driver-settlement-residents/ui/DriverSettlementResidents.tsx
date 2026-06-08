import { useState } from "react"
import { Check, Copy, MapPin, Phone } from "lucide-react"

import type { Order } from "@/shared/api/api-types"
import { useUpdateOrderStatus } from "@/entities/order/api/useOrders"
import { copyTextToClipboard } from "@/shared/lib/copy-text"
import { formatPrice } from "@/shared/lib/format"
import {
  isAwaitingTripAccept,
  isActiveForDelivery,
  residentDeliveryLabel,
} from "@/shared/lib/driver-orders"
import { orderStatusVariant } from "@/shared/lib/order-status"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  orders: Order[]
  showAcceptActions?: boolean
  compact?: boolean
}

const CopyPhoneButton = ({ phone }: { phone: string }) => {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-xs font-medium text-sky-700"
      onClick={() => {
        void copyTextToClipboard(phone).then((ok) => {
          if (ok) {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
          }
        })
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Скопировано" : "Копировать"}
    </button>
  )
}

export const DriverSettlementResidents = ({
  orders,
  showAcceptActions = false,
  compact,
}: Props) => {
  const updateStatus = useUpdateOrderStatus()

  if (orders.length === 0) {
    return (
      <p className="text-sm text-slate-500">В этом посёлке нет заказов на этом рейсе.</p>
    )
  }

  return (
    <ul className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
      {orders.map((order) => {
        const canAccept = showAcceptActions && isAwaitingTripAccept(order)
        const awaitingConfirm =
          order.status === "in_transit" || order.status === "at_pickup"

        return (
          <li key={order.id}>
            <Card className={compact ? "!p-3" : "!p-4"}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {order.userName ?? "Житель"}
                  </p>
                  {order.publicNumber ? (
                    <p className="text-xs text-slate-500">Заказ №{order.publicNumber}</p>
                  ) : null}
                </div>
                <Badge variant={orderStatusVariant[order.status]} className="shrink-0">
                  {residentDeliveryLabel(order)}
                </Badge>
              </div>

              {order.deliveryAddress ? (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-700">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{order.deliveryAddress}</span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-amber-700">Адрес не указан жителем</p>
              )}

              {order.userPhone ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <a
                    href={`tel:${order.userPhone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700"
                  >
                    <Phone size={14} />
                    {order.userPhone}
                  </a>
                  <CopyPhoneButton phone={order.userPhone} />
                </div>
              ) : null}

              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {order.items.map((item) => (
                  <li key={item.productId}>
                    {item.productName ?? "Товар"} × {item.quantity}
                  </li>
                ))}
              </ul>

              {order.comment ? (
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <span className="font-medium text-slate-500">Комментарий: </span>
                  {order.comment}
                </p>
              ) : null}

              <p className="mt-2 text-sm font-medium text-slate-900">
                {formatPrice(order.total)}
              </p>

              {canAccept ? (
                <Button
                  fullWidth
                  size="sm"
                  className="mt-3"
                  loading={
                    updateStatus.isPending &&
                    updateStatus.variables?.orderId === order.id
                  }
                  onClick={() =>
                    updateStatus.mutate({
                      orderId: order.id,
                      status: "confirmed",
                    })
                  }
                >
                  Принять в рейс
                </Button>
              ) : null}

              {awaitingConfirm && isActiveForDelivery(order) ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Вручите товар по адресу. Житель подтверждает получение в приложении —
                  оплата поступит после подтверждения.
                </p>
              ) : null}
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
