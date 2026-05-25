import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  procurementTitle?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const LeaveProcurementPanel = ({
  procurementTitle,
  loading,
  onConfirm,
  onCancel,
}: Props) => (
  <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
      Выйти из сбора{procurementTitle ? ` «${procurementTitle}»` : ""}?
    </p>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
      Корзина сохранится. Для оплаты нужно снова вступить в сбор.
    </p>
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <Button
        type="button"
        fullWidth
        variant="outline"
        className="border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/50"
        loading={loading}
        onClick={onConfirm}
      >
        Выйти из сбора
      </Button>
      <Button type="button" fullWidth variant="secondary" disabled={loading} onClick={onCancel}>
        Остаться
      </Button>
    </div>
  </Card>
)
