import { useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"

import type { Order } from "@/shared/api/api-types"
import { useUpdateOrderStatus } from "@/entities/order/api/useOrders"
import { copyTextToClipboard } from "@/shared/lib/copy-text"
import { formatPrice } from "@/shared/lib/format"
import {
  groupOrdersByResident,
  isAwaitingTripAccept,
  isActiveForDelivery,
  residentGroupDeliveryLabel,
  residentGroupDeliveryShortLabel,
} from "@/shared/lib/driver-orders"
import { orderStatusVariant } from "@/shared/lib/order-status"
import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  orders: Order[]
  showAcceptActions?: boolean
  compact?: boolean
}

const worstOrderStatus = (orders: Order[]) => {
  const priority = [
    "at_pickup",
    "in_transit",
    "confirmed",
    "pending",
    "delivered",
    "cancelled",
  ] as const
  for (const status of priority) {
    if (orders.some((o) => o.status === status)) return status
  }
  return orders[0]?.status ?? "pending"
}

const StatusBadge = ({ orders }: { orders: Order[] }) => (
  <Badge
    variant={orderStatusVariant[worstOrderStatus(orders)]}
    title={residentGroupDeliveryLabel(orders)}
    className="shrink-0 text-[10px] px-1.5 py-0 leading-4"
  >
    {residentGroupDeliveryShortLabel(orders)}
  </Badge>
)

const ResidentContactRow = ({
  name,
  phone,
}: {
  name: string
  phone?: string | null
}) => {
  const [copied, setCopied] = useState(false)

  if (!phone) {
    return <p className="text-sm text-slate-700 dark:text-slate-300">{name}</p>
  }

  const handleCopy = () => {
    void copyTextToClipboard(phone).then((ok) => {
      if (ok) {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }
    })
  }

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-2 rounded-lg text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
      onClick={handleCopy}
    >
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-800 dark:text-slate-200">{name}</p>
        <p className="truncate text-sm font-medium text-sky-700 dark:text-sky-400">
          {phone}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-slate-500">
        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
        {copied ? "Скопировано" : "Копировать"}
      </span>
    </button>
  )
}

export const DriverSettlementResidents = ({
  orders,
  showAcceptActions = false,
  compact,
}: Props) => {
  const updateStatus = useUpdateOrderStatus()
  const residentGroups = useMemo(() => groupOrdersByResident(orders), [orders])

  if (orders.length === 0) {
    return (
      <p className="text-sm text-slate-500">В этом посёлке нет заказов на этом рейсе.</p>
    )
  }

  return (
    <ul className={compact ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
      {residentGroups.map((group) => {
        const primary = group[0]
        const residentName = primary.userName ?? "Житель"
        const deliveryAddress =
          group.find((o) => o.deliveryAddress)?.deliveryAddress ?? null
        const orderNumbers = group
          .map((o) => o.publicNumber)
          .filter((n): n is string => Boolean(n))
        const itemsMap = new Map<
          string,
          { productId: string; productName?: string; quantity: number }
        >()
        for (const order of group) {
          for (const item of order.items) {
            const cur = itemsMap.get(item.productId)
            if (cur) cur.quantity += item.quantity
            else itemsMap.set(item.productId, { ...item })
          }
        }
        const allItems = [...itemsMap.values()]
        const totalSum = group.reduce((sum, o) => sum + o.total, 0)
        const comments = group
          .map((o) => o.comment?.trim())
          .filter((c): c is string => Boolean(c))
        const toAccept = group.filter(isAwaitingTripAccept)
        const canAccept = showAcceptActions && toAccept.length > 0
        const toHandOut = group.filter(
          (o) => o.status === "in_transit" || o.status === "confirmed",
        )
        const awaitingConfirm = group.some((o) => o.status === "at_pickup")
        const activeForDelivery = group.some(isActiveForDelivery)

        return (
          <li key={primary.userId || primary.id}>
            <Card className={cn("overflow-hidden !p-0", compact ? "" : "")}>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-700/80">
                <div className="min-w-0 flex-1">
                  {deliveryAddress ? (
                    <p className="text-base font-bold leading-snug text-slate-900 dark:text-slate-100">
                      {deliveryAddress}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      Адрес не указан
                    </p>
                  )}
                </div>
                <StatusBadge orders={group} />
              </div>

              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700/80">
                <ResidentContactRow name={residentName} phone={primary.userPhone} />
              </div>

              {orderNumbers.length > 0 ? (
                <p className="px-3 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {orderNumbers.length === 1
                    ? `Заказ №${orderNumbers[0]}`
                    : `Заказы №${orderNumbers.join(", №")}`}
                </p>
              ) : null}

              <ul className="mx-3 mb-3 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40">
                {allItems.map((item, index) => (
                  <li
                    key={`${item.productId}-${index}`}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2",
                      index > 0 && "border-t border-slate-200/80 dark:border-slate-700/80",
                    )}
                  >
                    <span className="min-w-0 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.productName ?? "Товар"}
                    </span>
                    <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      ×{item.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              {comments.map((comment, index) => (
                <p
                  key={index}
                  className="mx-3 mb-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200"
                >
                  <span className="font-semibold">
                    {comments.length > 1 ? `Комментарий ${index + 1}: ` : "Комментарий: "}
                  </span>
                  {comment}
                </p>
              ))}

              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2.5 dark:border-slate-700/80">
                <span className="text-xs text-slate-500">
                  {group.length > 1 ? `Сумма (${group.length} заказа)` : "Сумма"}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatPrice(totalSum)}
                </span>
              </div>

              {canAccept ? (
                <div className="border-t border-slate-100 px-3 py-2.5 dark:border-slate-700/80">
                  <Button
                    fullWidth
                    size="sm"
                    loading={updateStatus.isPending}
                    onClick={() => {
                      void Promise.all(
                        toAccept.map((order) =>
                          updateStatus.mutateAsync({
                            orderId: order.id,
                            status: "confirmed",
                          }),
                        ),
                      )
                    }}
                  >
                    {toAccept.length > 1
                      ? `Принять в рейс (${toAccept.length})`
                      : "Принять в рейс"}
                  </Button>
                </div>
              ) : null}

              {!showAcceptActions && toHandOut.length > 0 ? (
                <div className="border-t border-slate-100 px-3 py-2.5 dark:border-slate-700/80">
                  <Button
                    fullWidth
                    size="sm"
                    className="ui-cta-primary"
                    loading={updateStatus.isPending}
                    onClick={() => {
                      void Promise.all(
                        toHandOut.map((order) =>
                          updateStatus.mutateAsync({
                            orderId: order.id,
                            status: "at_pickup",
                          }),
                        ),
                      )
                    }}
                  >
                    {toHandOut.length > 1
                      ? `Вручил товар (${toHandOut.length}) — ждёт подтверждения`
                      : "Вручил товар — ждёт подтверждения"}
                  </Button>
                </div>
              ) : null}

              {awaitingConfirm && activeForDelivery && !compact ? (
                <p className="border-t border-slate-100 px-3 py-2 text-xs leading-relaxed text-slate-500 dark:border-slate-700/80">
                  Житель подтверждает получение в приложении.
                </p>
              ) : null}
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
