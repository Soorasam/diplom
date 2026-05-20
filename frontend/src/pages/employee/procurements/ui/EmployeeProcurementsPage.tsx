import { CheckCircle2, PackageSearch } from "lucide-react"

import { useApproveProcurementReceipt, useAllProcurements } from "@/entities/procurement/api/useProcurements"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"

export const EmployeeProcurementsPage = () => {
  const { data: list = [] } = useAllProcurements()
  const approve = useApproveProcurementReceipt("employee")

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Доставленные сборы"
        subtitle="Сотрудник ПВЗ подтверждает приемку товара"
      />

      {list.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Пока нет сборов"
          description="Здесь будут сборы, по которым нужно подтвердить приемку"
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((p) => (
            <li key={p.id}>
              <Card className="border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500">
                      Дедлайн: {formatShortDate(p.closesAt)}
                    </p>
                  </div>
                  <Badge variant={p.status === "closed" ? "success" : "info"}>{p.status}</Badge>
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    leftIcon={<CheckCircle2 size={16} />}
                    disabled={approve.isPending}
                    onClick={() => approve.mutate(p.id)}
                  >
                    Подтвердить приемку в ПВЗ
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

