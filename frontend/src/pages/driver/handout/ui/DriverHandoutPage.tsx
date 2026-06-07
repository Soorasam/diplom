import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Package, Search, WifiOff } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routesApi } from "@/entities/route/api/routesApi"
import { useDriverHandout } from "@/features/driver-handout/hooks/useDriverHandout"
import { useNetworkStore } from "@/features/offline/model/network-store"
import { useOfflineQueueStore } from "@/features/offline/model/offline-queue-store"
import { queryKeys } from "@/shared/config/query-keys"
import { formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const HANDOUT_STATUSES = new Set(["confirmed", "in_transit", "at_pickup"])

export const DriverHandoutPage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : ""
  const [query, setQuery] = useState("")
  const isOnline = useNetworkStore((s) => s.isOnline)
  const queuedCount = useOfflineQueueStore((s) =>
    s.actions.filter((a) => a.type === "driver.order.confirm_handout" && a.status !== "done").length,
  )

  const { data: orders, isLoading } = useQuery({
    queryKey: [...queryKeys.routes.driver(driverId), "orders"],
    queryFn: () => routesApi.getDriverOrders(driverId),
    enabled: Boolean(driverId),
  })

  const handout = useDriverHandout(driverId)

  const pending = useMemo(() => {
    const list = (orders ?? []).filter((o) => HANDOUT_STATUSES.has(o.status))
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((o) => {
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
  }, [orders, query])

  return (
    <PageShell>
      <PageHeader
        title="Выдача заказов"
        subtitle="Раздача жителям на общей точке в посёлке"
      />

      {!isOnline ? (
        <AlertBanner variant="warning" title="Нет сети">
          Отметки «Выдан» сохранятся локально и отправятся при восстановлении связи.
          {queuedCount > 0 ? ` В очереди: ${queuedCount}.` : null}
        </AlertBanner>
      ) : null}

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
      ) : pending.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Нет заказов к выдаче"
          description="Заказы появятся после закрытия сбора и старта рейса"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((order) => {
            const itemsText = order.items
              .map((i) => `${i.productName ?? "Товар"} × ${i.quantity}`)
              .join(", ")
            return (
              <li key={order.id}>
                <Card className="!p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {order.publicNumber ? `#${order.publicNumber}` : order.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">{order.userName ?? "Житель"}</p>
                    </div>
                    <Badge variant={orderStatusVariant[order.status]}>
                      {orderStatusLabel[order.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{itemsText}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatPrice(order.total)}
                  </p>
                  <Button
                    className="mt-3"
                    fullWidth
                    size="sm"
                    loading={handout.isPending && handout.variables === order.id}
                    onClick={() => handout.mutate(order.id)}
                  >
                    {!isOnline ? <WifiOff size={16} /> : null}
                    Выдан жителю
                  </Button>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </PageShell>
  )
}
