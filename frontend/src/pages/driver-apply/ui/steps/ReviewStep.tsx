import { Loader2, Send, Truck } from "lucide-react"

import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  vehicleSummary: string
  isSubmitting: boolean
  onSubmit: () => void
  onBack: () => void
}

export const ReviewStep = ({
  vehicleSummary,
  isSubmitting,
  onSubmit,
  onBack,
}: Props) => (
  <Card className="border-slate-200">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Truck size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">Проверка заявки</p>
        <p className="mt-1 text-sm text-slate-600">
          Проверьте данные. После отправки статус станет{" "}
          <span className="font-semibold">pending</span>.
        </p>
        <p className="mt-2 text-xs font-medium text-slate-700">
          Авто: {vehicleSummary || "—"}
        </p>
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-2">
      <Button
        type="button"
        fullWidth
        disabled={isSubmitting}
        leftIcon={
          isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )
        }
        onClick={onSubmit}
      >
        Отправить на проверку
      </Button>
      <Button type="button" fullWidth variant="secondary" onClick={onBack}>
        Назад
      </Button>
    </div>
  </Card>
)
