import { ChevronLeft } from "lucide-react"

import {
  type DriverApplyStep,
  driverApplyStepLabels,
  prevDriverApplyStep,
} from "../model/driver-apply-step"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  step: DriverApplyStep
  lastSavedAt?: string
  onBack: () => void
}

export const DriverApplyStepNav = ({ step, lastSavedAt, onBack }: Props) => {
  const canGoBack = prevDriverApplyStep(step) !== null

  return (
    <Card className="border-slate-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {canGoBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              aria-label="Назад"
            >
              <ChevronLeft size={18} />
            </button>
          ) : null}
          <p className="text-sm font-semibold text-slate-900">
            Шаг: {driverApplyStepLabels[step]}
          </p>
        </div>
        {lastSavedAt ? (
          <p className="text-xs text-slate-500">Автосохранено</p>
        ) : null}
      </div>
    </Card>
  )
}
