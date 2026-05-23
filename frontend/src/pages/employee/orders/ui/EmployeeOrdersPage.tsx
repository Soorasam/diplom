import { CheckCircle2, Package, Search, WifiOff } from "lucide-react"
import { useMemo, useState } from "react"

import { employeeApi } from "@/entities/employee/api/employeeApi"
import {
  useEmployeeHandout,
  useEmployeeWorkspace,
} from "@/entities/employee/api/useEmployeeWorkspace"
import { useNetworkStore } from "@/features/offline/model/network-store"
import { useOfflineQueueStore } from "@/features/offline/model/offline-queue-store"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Badge } from "@/shared/ui/badge/Badge"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import { Button } from "@/shared/ui/button/Button"

export const EmployeeOrdersPage = () => {
  const [query, setQuery] = useState("")
  const isOnline = useNetworkStore((s) => s.isOnline)
  const queuedCount = useOfflineQueueStore((s) =>
    s.actions.filter((a) => a.status === "queued" || a.status === "failed").length,
  )

  const { data: workspace, isLoading } = useEmployeeWorkspace()
  const handout = useEmployeeHandout()

  const orders = useMemo(
    () => (workspace?.handoutOrders ?? []).map(employeeApi.mapWorkspaceOrder),
    [workspace],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((o) => {
      const hay = [o.id, o.userName, o.userPhone, o.itemsText, o.roundTitle].join(" ").toLowerCase()
      return hay.includes(q)
    })
  }, [orders, query])

  return (
    <PageShell>
      <PageHeader
        title="Выдача жителям"
        subtitle="Заказы, принятые от водителя и готовые к получению"
      />

      {!isOnline ? (
        <Card className="border-amber-200 bg-amber-50/40">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <WifiOff size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Нет сети</p>
              <p className="mt-1 text-sm text-slate-600">
                Выдача сохраняется локально и синхронизируется автоматически.
              </p>
              {queuedCount > 0 ? (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  В очереди: {queuedCount}
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      ) : queuedCount > 0 ? (
        <Card className="ui-panel">
          <p className="text-sm font-semibold text-slate-900">Синхронизация</p>
          <p className="mt-1 text-sm text-slate-600">
            В очереди действий: {queuedCount}.
          </p>
        </Card>
      ) : null}

      <Card className="border-slate-200">
        <Input
          label="Поиск"
          placeholder="Фамилия, номер заказа, товар"
          leftIcon={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : filtered.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <Card className="border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">№ {o.id.slice(0, 8)}</p>
                    {o.roundTitle ? (
                      <p className="text-xs ui-text-muted">{o.roundTitle}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-slate-500">
                      {o.userName} · {o.userPhone}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{o.itemsText}</p>
                  </div>
                  <Badge variant={orderStatusVariant[o.status]}>
                    {orderStatusLabel[o.status]}
                  </Badge>
                </div>

                <Button
                  type="button"
                  className="mt-4 w-full"
                  leftIcon={<CheckCircle2 size={16} />}
                  disabled={handout.isPending}
                  onClick={() => handout.mutate(o.id)}
                >
                  Выдать жителю
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Package}
          title="Нет заказов на выдачу"
          description="Сначала примите товар от водителя во вкладке «Приём»"
        />
      )}
    </PageShell>
  )
}
