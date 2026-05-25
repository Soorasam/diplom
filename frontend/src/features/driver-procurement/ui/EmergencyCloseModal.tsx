import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { cn } from "@/shared/lib/cn"
import { emergencyCloseDurationLabel } from "@/shared/lib/countdown"

const CONFIRM_DELAY_SEC = 10

type Props = {
  open: boolean
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const EmergencyCloseModal = ({ open, loading, onCancel, onConfirm }: Props) => {
  const [secondsLeft, setSecondsLeft] = useState(CONFIRM_DELAY_SEC)

  useEffect(() => {
    if (!open) {
      setSecondsLeft(CONFIRM_DELAY_SEC)
      return
    }
    setSecondsLeft(CONFIRM_DELAY_SEC)
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [open])

  if (!open) return null

  const canConfirm = secondsLeft === 0

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/55 p-4 backdrop-blur-[3px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-close-title"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-md border-2 border-amber-200 bg-gradient-to-b from-amber-50/90 to-white shadow-xl shadow-amber-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-4 ring-amber-100/80">
            <AlertTriangle size={22} />
          </span>
          <div>
            <p id="emergency-close-title" className="text-lg font-bold text-amber-950">
              Экстренное закрытие сбора
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-950/80">
              Вы хотите закрыть сбор преждевременно? После подтверждения ваш сбор получит
              таймер на {emergencyCloseDurationLabel()}, затем приём заказов завершится и сбор
              закроется.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3" aria-live="polite">
          <Button
            type="button"
            variant={canConfirm ? "danger" : "outline"}
            fullWidth
            disabled={!canConfirm}
            loading={loading}
            onClick={onConfirm}
            className={cn(
              !canConfirm &&
                "min-h-12 flex-col gap-1 border-2 border-amber-500 bg-amber-50 py-4 text-amber-950 hover:border-amber-500 hover:bg-amber-50 disabled:pointer-events-none disabled:opacity-100",
            )}
          >
            {canConfirm ? (
              "Подтвердить закрытие"
            ) : (
              <>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Подтверждение через {secondsLeft} сек
                </span>
                <span className="text-sm font-medium text-amber-950/60">
                  Кнопка станет активной автоматически
                </span>
              </>
            )}
          </Button>
          <Button type="button" variant="outline" fullWidth onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </Card>
    </div>
  )
}
