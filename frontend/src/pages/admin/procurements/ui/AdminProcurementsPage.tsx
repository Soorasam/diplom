import { CheckCircle2, ShoppingBasket } from "lucide-react"

import { useAdminRounds } from "@/entities/admin/api/useAdmin"
import { useApproveProcurementReceipt } from "@/entities/procurement/api/useProcurements"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"

export const AdminProcurementsPage = () => {
  const { data: list = [], isLoading } = useAdminRounds()
  const approve = useApproveProcurementReceipt("admin")

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Сборы" subtitle="Админ подтверждает приемку и контролирует цикл" />

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
                      p.status === "shipped" || p.status === "closed"
                        ? "success"
                        : p.status === "closing"
                          ? "warning"
                          : "info"
                    }
                  >
                    {p.status}
                  </Badge>
                </div>
                {p.status === "closed" ? (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      leftIcon={<CheckCircle2 size={16} />}
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(p.id)}
                    >
                      Подтвердить приемку (админ)
                    </Button>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

