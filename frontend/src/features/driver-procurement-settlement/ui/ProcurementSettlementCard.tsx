import { useState } from "react"
import { Calculator, Receipt } from "lucide-react"

import {
  useProcurementReceipts,
  usePurchaseSettlement,
  useSettlePurchase,
} from "@/entities/procurement-settlement/api/useProcurementSettlement"
import { ProcurementReceiptsGallery } from "@/features/procurement-receipts/ui/ProcurementReceiptsGallery"
import { formatPrice } from "@/shared/lib/format"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"
import { Spinner } from "@/shared/ui/spinner/Spinner"

type Props = {
  roundId: string
  embedded?: boolean
}

export const ProcurementSettlementCard = ({
  roundId,
  embedded,
}: Props) => {
  const [actualTotal, setActualTotal] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data: settlement, isLoading, isError, error: loadError } = usePurchaseSettlement(roundId)
  const { data: receipts = [] } = useProcurementReceipts(roundId)
  const settle = useSettlePurchase(roundId)

  const isSettled = Boolean(settlement?.purchaseSettledAt)
  const reservedTotal = settlement?.reservedTotal ?? 0

  const handleSettle = async () => {
    const value = parseFloat(actualTotal.replace(",", "."))
    if (!Number.isFinite(value) || value <= 0) {
      setError("Введите сумму по чекам")
      return
    }
    if (value > reservedTotal) {
      setError("Сумма по чекам не может превышать зарезервированную сумму заказов")
      return
    }
    setError(null)
    try {
      await settle.mutateAsync(value)
      setActualTotal("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось провести сверку")
    }
  }

  if (isLoading) {
    return (
      <Card className="flex justify-center py-8">
        <Spinner />
      </Card>
    )
  }

  if (isError) {
    const msg = loadError instanceof Error ? loadError.message : "Сверка недоступна"
    if (msg.includes("закрыт") || msg.includes("open") || msg.includes("404")) {
      return null
    }
    return (
      <AlertBanner variant="warning" title="Сверка по чекам">
        {msg}
      </AlertBanner>
    )
  }

  if (!settlement) return null

  return (
    <Card
      className={
        embedded
          ? "border-emerald-200/80 bg-emerald-50/50 !p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : "border-emerald-200 bg-emerald-50/40"
      }
    >
      <div className="flex items-start gap-3">
        {!embedded ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Receipt size={20} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
            Сверка по чекам
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {embedded
              ? "Укажите итоговую сумму по всем чекам маршрута — без сверки нельзя завершить последнюю закупку."
              : "Цена в каталоге — ориентир. После закупа по чекам возможен возврат переплаты жителям."}
          </p>
        </div>
      </div>

      <ProcurementReceiptsGallery receipts={receipts} />

      {!isSettled ? (
        <>
          <div className="mt-4 space-y-3 border-t border-emerald-100 pt-4">
            <Input
              label="Итого по чекам, ₽"
              type="number"
              min={0}
              step="0.01"
              max={reservedTotal || undefined}
              value={actualTotal}
              onChange={(e) => setActualTotal(e.target.value)}
              placeholder={reservedTotal ? `до ${formatPrice(reservedTotal)}` : "0"}
            />
            <p className="text-xs text-slate-500">
              Зарезервировано жителями: {formatPrice(reservedTotal)}
              {receipts.length === 0
                ? " · прикрепите чеки на каждой точке закупки"
                : ` · чеков по точкам: ${receipts.length}`}
            </p>
            <Button
              type="button"
              fullWidth
              leftIcon={<Calculator size={18} />}
              loading={settle.isPending}
              disabled={receipts.length === 0 || !actualTotal.trim()}
              onClick={() => void handleSettle()}
            >
              Провести сверку
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-4 space-y-3 border-t border-emerald-100 pt-4 text-sm">
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-slate-500">Зарезервировано</dt>
              <dd className="font-semibold text-slate-900">
                {formatPrice(settlement.reservedTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Факт по чекам</dt>
              <dd className="font-semibold text-slate-900">
                {formatPrice(settlement.actualPurchaseTotal ?? 0)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Возврат жителям</dt>
              <dd className="font-semibold text-emerald-700">
                {formatPrice(settlement.refundTotal)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">К выплате водителю</dt>
              <dd className="font-semibold text-slate-900">{formatPrice(settlement.netTotal)}</dd>
            </div>
          </dl>

          {settlement.orders.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-emerald-100 bg-white">
              <table className="w-full min-w-[280px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="px-3 py-2 font-medium">Заказ</th>
                    <th className="px-3 py-2 font-medium text-right">Ориентир</th>
                    <th className="px-3 py-2 font-medium text-right">Возврат</th>
                    <th className="px-3 py-2 font-medium text-right">К выплате</th>
                  </tr>
                </thead>
                <tbody>
                  {settlement.orders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {o.publicNumber || o.id.slice(0, 8)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatPrice(o.totalEstimate)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                        {o.refundAmount > 0 ? formatPrice(o.refundAmount) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {formatPrice(o.netHeld)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <p className="text-xs text-slate-500">
            Сверка проведена. Изменить сумму может только администратор через поддержку.
          </p>
        </div>
      )}

      {error ? (
        <AlertBanner variant="warning" className="mt-3">
          {error}
        </AlertBanner>
      ) : null}
    </Card>
  )
}
