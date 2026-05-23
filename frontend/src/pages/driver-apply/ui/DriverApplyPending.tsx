import { routes } from "@/shared/config/routes"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"

export const DriverApplyPending = () => (
  <div className="flex flex-col gap-4">
    <PageHeader
      title="Стать водителем"
      subtitle="Заявка отправлена и ожидает проверки"
      backTo={routes.profile}
    />

    <Card className="border-amber-200 bg-amber-50/40">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Статус заявки</p>
          <p className="mt-1 text-sm text-slate-600">
            На проверке. После одобрения здесь появится переключатель роли водителя.
          </p>
        </div>
        <Badge variant="warning">pending</Badge>
      </div>
    </Card>
  </div>
)
