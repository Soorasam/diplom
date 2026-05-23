import { CheckCircle2, PackageCheck, Truck } from "lucide-react"
import { useState } from "react"

import { employeeApi } from "@/entities/employee/api/employeeApi"
import {
  useEmployeeReceive,
  useEmployeeWorkspace,
} from "@/entities/employee/api/useEmployeeWorkspace"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const stopStatusLabel = {
  pending: "Ожидает водителя",
  in_progress: "Приём идёт",
  completed: "Точка закрыта",
} as const

export const EmployeeIntakePage = () => {
  const { data: workspace, isLoading } = useEmployeeWorkspace()
  const receive = useEmployeeReceive()
  const [justCompletedRound, setJustCompletedRound] = useState<string | null>(null)

  const handleReceive = async (orderId: string, roundId: string) => {
    const result = await receive.mutateAsync(orderId)
    if (result?.stopCompleted) {
      setJustCompletedRound(roundId)
      setTimeout(() => setJustCompletedRound(null), 4000)
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      </PageShell>
    )
  }

  const groups = workspace?.intakeGroups ?? []

  return (
    <PageShell>
      <PageHeader
        title="Приём от водителя"
        subtitle={
          workspace
            ? `${workspace.pickupPoint.name} · ${workspace.pickupPoint.settlementName}`
            : "Отметьте каждый заказ при передаче товара"
        }
      />

      {workspace?.hints && workspace.hints.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {workspace.hints.map((hint) => (
            <li
              key={hint}
              className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm text-amber-900"
            >
              {hint}
            </li>
          ))}
        </ul>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Нет рейсов на приём"
          description="Заказы появятся после закрытия сбора и отправки рейса (статус «в пути»). Проверьте, что житель выбрал ваш ПВЗ в профиле."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {groups.map((group) => {
            const pct =
              group.progress.total > 0
                ? Math.round((group.progress.received / group.progress.total) * 100)
                : 0
            const done = group.stopStatus === "completed"

            return (
              <li key={group.roundId}>
                <Card
                  className={
                    done
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-blue-100"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{group.roundTitle}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {group.progress.received} из {group.progress.total} принято
                      </p>
                    </div>
                    <Badge variant={done ? "success" : "info"}>
                      {stopStatusLabel[group.stopStatus]}
                    </Badge>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        done ? "bg-emerald-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {justCompletedRound === group.roundId ? (
                    <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                      Все заказы на вашем ПВЗ приняты — водитель может ехать дальше
                    </p>
                  ) : null}

                  <ul className="mt-4 flex flex-col gap-2">
                    {group.orders.map((order) => {
                      const view = employeeApi.mapWorkspaceOrder(order)
                      const canReceive = order.canReceive ?? order.status === "in_transit"
                      return (
                        <li
                          key={order.id}
                          className="rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
                                № {order.id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {view.userName} · {view.userPhone}
                              </p>
                              <p className="mt-1 text-sm text-slate-700">{view.itemsText}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            className="mt-3 w-full"
                            leftIcon={<PackageCheck size={18} />}
                            disabled={receive.isPending || done || !canReceive}
                            onClick={() => void handleReceive(order.id, group.roundId)}
                          >
                            {canReceive
                              ? "Принять от водителя"
                              : "Ожидает отправки водителя"}
                          </Button>
                        </li>
                      )
                    })}
                  </ul>

                  {done ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 size={18} />
                      Точка маршрута закрыта
                    </div>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </PageShell>
  )
}
