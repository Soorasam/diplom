import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  rejectionReason?: string
}

export const DriverApplyRejectedBanner = ({ rejectionReason }: Props) => (
  <Card className="border-slate-200">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">Статус заявки</p>
        <p className="mt-1 text-sm text-slate-600">
          Отклонено — исправьте данные и отправьте заново
        </p>
        {rejectionReason ? (
          <p className="mt-2 text-sm font-medium text-amber-800">
            Причина: {rejectionReason}
          </p>
        ) : null}
      </div>
      <Badge variant="danger">rejected</Badge>
    </div>
  </Card>
)
