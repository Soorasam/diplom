import { Card } from "@/shared/ui/card/Card"

export const DriverApplyOfflineBanner = () => (
  <Card className="border-amber-200 bg-amber-50/40">
    <p className="text-sm font-semibold text-slate-900">Вы офлайн</p>
    <p className="mt-1 text-sm text-slate-600">
      Черновик сохранится. Отправка заявки — при появлении сети.
    </p>
  </Card>
)
