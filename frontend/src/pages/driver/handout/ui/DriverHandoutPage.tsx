import { useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { Package, Search } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useUpdateOrderStatus } from "@/entities/order/api/useOrders"
import { routesApi } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"
import { formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import {
  paymentStatusLabel,
  paymentStatusVariant,
} from "@/shared/lib/payment-status"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const DriverHandoutPage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : ""
  const [query, setQuery] = useState("")
  const updateStatus = useUpdateOrderStatus()

  const { data: orders, isLoading } = useQuery({
    queryKey: [...queryKeys.routes.driver(driverId), "orders"],
    queryFn: () => routesApi.getDriverOrders(driverId),
    enabled: Boolean(driverId),
  })

  const filterOrders = (list: typeof orders) => {
    const q = query.trim().toLowerCase()
    if (!q) return list ?? []
    return (list ?? []).filter((o) => {
      const hay = [
        o.id,
        o.publicNumber ?? "",
        o.userName ?? "",
        ...o.items.map((i) => i.productName ?? ""),
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }

  const awaitingAccept = useMemo(
    () => filterOrders(orders?.filter((o) => o.status === "pending")),
    [orders, query],
  )

  const inDelivery = useMemo(
    () => filterOrders(orders?.filter((o) => o.status === "in_transit")),
    [orders, query],
  )

  const renderOrderCard = (
    order: NonNullable<typeof orders>[number],
    actions?: ReactNode,
  ) => {
    const itemsText = order.items
      .map((i) => `${i.productName ?? "Товар"} × ${i.quantity}`)
      .join(", ")
    const payLabel =
      order.paymentStatusLabel ??
      (order.paymentStatus ? paymentStatusLabel[order.paymentStatus] : "—")

    return (
      <Card className="!p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">
              {order.publicNumber ? `#${order.publicNumber}` : order.id.slice(0, 8)}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">{order.userName ?? "Житель"}</p>
            {order.userPhone ? (
              <p className="text-xs text-slate-500">{order.userPhone}</p>
            ) : null}
          </div>
          <Badge variant={orderStatusVariant[order.status]}>
            {order.statusLabel ?? orderStatusLabel[order.status]}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-slate-700">{itemsText}</p>
        {order.comment ? (
          <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="text-xs font-medium text-slate-500">Комментарий жителя: </span>
            {order.comment}
          </p>
        ) : null}
        <p className="mt-1 text-sm font-medium text-slate-900">{formatPrice(order.total)}</p>
        {order.paymentStatus ? (
          <Badge variant={paymentStatusVariant[order.paymentStatus]} className="mt-2">
            {payLabel}
          </Badge>
        ) : null}
        {actions ? <div className="mt-3">{actions}</div> : null}
      </Card>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="Заказы сбора"
        subtitle="Принятие в рейс и выдача жителям"
      />

      <AlertBanner variant="info" title="Как работает оплата">
        Деньги жителя на платформе (эскроу). На выдаче не принимайте оплату — попросите
        жителя нажать «Товар получен» в приложении.
      </AlertBanner>

      <Input
        placeholder="Поиск: номер, ФИО, товар…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search size={18} />}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <p className="mb-2 text-sm font-semibold text-slate-800">
              Ожидают принятия в рейс
            </p>
            {awaitingAccept.length === 0 ? (
              <p className="text-sm text-slate-500">Нет новых оплаченных заказов</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {awaitingAccept.map((order) => {
                  const canAccept = order.paymentStatus === "held"
                  return (
                    <li key={order.id}>
                      {renderOrderCard(
                        order,
                        <Button
                          fullWidth
                          size="sm"
                          disabled={!canAccept}
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
                          {canAccept
                            ? "Принять в рейс"
                            : "Ожидает оплаты жителем"}
                        </Button>,
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-slate-800">В доставке</p>
            {inDelivery.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Нет заказов в пути"
                description="После старта рейса здесь появятся заказы для выдачи"
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {inDelivery.map((order) => (
                  <li key={order.id}>
                    {renderOrderCard(
                      order,
                      <Button
                        fullWidth
                        size="sm"
                        className="ui-cta-primary"
                        loading={
                          updateStatus.isPending &&
                          updateStatus.variables?.orderId === order.id
                        }
                        onClick={() =>
                          updateStatus.mutate({
                            orderId: order.id,
                            status: "at_pickup",
                          })
                        }
                      >
                        Вручил товар — ждёт подтверждения
                      </Button>,
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageShell>
  )
}
