import { ShoppingBasket, Truck } from "lucide-react"

import { adminApi } from "@/entities/admin/api/adminApi"
import { useAdminRounds } from "@/entities/admin/api/useAdmin"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/shared/config/query-keys"

export const AdminProcurementsPage = () => {
  const { data: list = [], isLoading } = useAdminRounds()
  const qc = useQueryClient()

  const closeAndDispatch = useMutation({
    mutationFn: (id: string) => adminApi.closeAndDispatchRound(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...queryKeys.admin.stats, "rounds"] })
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Сборы"
        subtitle="Закрытие сбора отправляет рейс: заказы «в пути», водитель видит точки"
      />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-500">Загрузка…</p>
      ) : list.length === 0 ? (
        <EmptyState icon={ShoppingBasket} title="Сборов нет" />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((p) => (
            <li key={p.id}>
              <Card className="border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500">Дедлайн: {formatShortDate(p.closesAt)}</p>
                  </div>
                  <Badge
                    variant={
                      p.status === "shipped"
                        ? "success"
                        : p.status === "closed"
                          ? "warning"
                          : "info"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
                {p.status === "open" || p.status === "closing" ? (
                  <div className="mt-3">
                    <Button
                      type="button"
                      leftIcon={<Truck size={16} />}
                      disabled={closeAndDispatch.isPending}
                      onClick={() => closeAndDispatch.mutate(p.id)}
                    >
                      Закрыть сбор и отправить рейс
                    </Button>
                  </div>
                ) : p.status === "closed" ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Рейс в доставке. Водитель раздаёт заказы в посёлках на маршруте.
                  </p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
