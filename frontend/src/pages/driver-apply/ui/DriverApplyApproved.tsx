import { InterfaceModeSwitch } from "@/features/auth/ui/InterfaceModeSwitch"
import { routes } from "@/shared/config/routes"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"

export const DriverApplyApproved = () => (
  <div className="flex flex-col gap-4">
    <PageHeader
      title="Стать водителем"
      subtitle="Заявка одобрена — включите режим водителя, когда будете на маршруте"
      backTo={routes.user.profile}
    />

    <Card className="border-emerald-200 bg-emerald-50/40">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Статус заявки</p>
          <p className="mt-1 text-sm text-slate-600">
            Одобрено — доступен интерфейс водителя и маршруты.
          </p>
        </div>
        <Badge variant="success">approved</Badge>
      </div>
    </Card>

    <InterfaceModeSwitch navigateOnSwitch />
  </div>
)
