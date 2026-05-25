import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, ShoppingCart, Truck } from "lucide-react"

import {
  procurementChecklistApi,
  type ProcurementOutcome,
} from "@/entities/driver-procurement/api/procurementChecklistApi"
import { queryKeys } from "@/shared/config/query-keys"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"

type RowState = {
  outcome: ProcurementOutcome
}

type Props = {
  roundId: string
}

export const ProcurementChecklistCard = ({ roundId }: Props) => {
  const qc = useQueryClient()
  const [rowState, setRowState] = useState<Record<string, RowState>>({})
  const [saved, setSaved] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["driver", "procurement-checklist", roundId],
    queryFn: () => procurementChecklistApi.getActive(roundId),
    enabled: Boolean(roundId),
  })

  const checklist = data?.active ? data : null

  const defaultRows = useMemo(() => {
    if (!checklist) return {}
    const next: Record<string, RowState> = {}
    for (const item of checklist.items) {
      next[item.orderItemId] = { outcome: "purchased" }
    }
    return next
  }, [checklist?.pickupPointId, checklist?.items.length])

  const rows = Object.keys(rowState).length > 0 ? rowState : defaultRows

  const submit = useMutation({
    mutationFn: () => {
      if (!checklist) throw new Error("no checklist")
      const items = checklist.items.map((line) => ({
        orderItemId: line.orderItemId,
        outcome: (rows[line.orderItemId]?.outcome ?? "purchased") as ProcurementOutcome,
      }))
      return procurementChecklistApi.submit(
        roundId,
        checklist.pickupPointId,
        items,
      )
    },
    onSuccess: (res) => {
      setSaved(res.canDepart)
      void refetch()
      void qc.invalidateQueries({ queryKey: queryKeys.routes.driver("") })
    },
  })

  const depart = useMutation({
    mutationFn: () => {
      if (!checklist) throw new Error("no checklist")
      return procurementChecklistApi.depart(roundId, checklist.pickupPointId)
    },
    onSuccess: () => {
      setRowState({})
      setSaved(false)
      void refetch()
      void qc.invalidateQueries({ queryKey: ["driver", "procurement-checklist", roundId] })
      void qc.invalidateQueries({ queryKey: queryKeys.routes.driver("") })
      void qc.invalidateQueries({ queryKey: ["driver", "delivery-procurement"] })
    },
  })

  if (isLoading) {
    return (
      <Card className="flex justify-center py-8">
        <Spinner />
      </Card>
    )
  }

  if (!checklist) return null

  if (checklist.procurementCompleted && checklist.items.length === 0) {
    return null
  }

  const setOutcome = (orderItemId: string, outcome: ProcurementOutcome) => {
    setSaved(false)
    setRowState((prev) => ({
      ...Object.keys(prev).length ? prev : defaultRows,
      [orderItemId]: { outcome },
    }))
  }

  const allMarked = checklist.items.every((i) => rows[i.orderItemId]?.outcome)

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <ShoppingCart size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-amber-800">Чек-лист закупа</p>
          <p className="font-semibold text-slate-900">{checklist.locationName}</p>
          <p className="text-xs text-slate-600">{checklist.address}</p>
        </div>
      </div>

      {checklist.items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          На этой точке нечего закупать — нажмите «В пути».
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {checklist.items.map((line) => {
            const outcome = rows[line.orderItemId]?.outcome ?? "purchased"
            return (
              <li
                key={line.orderItemId}
                className="rounded-xl border border-amber-100 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{line.productName}</p>
                    <p className="text-xs text-slate-500">
                      {line.quantity} {line.unit} · заказ {line.orderNumber} →{" "}
                      {line.deliveryPvzName}
                    </p>
                    <p className="text-xs text-slate-600">~{line.lineTotal.toFixed(0)} ₽</p>
                  </div>
                  {outcome === "purchased" ? (
                    <Check size={18} className="shrink-0 text-emerald-600" />
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-lg px-2 py-1 text-xs font-medium ${
                      outcome === "purchased"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() => setOutcome(line.orderItemId, "purchased")}
                  >
                    Купил
                  </button>
                  {checklist.hasNextProcurementPoint ? (
                    <button
                      type="button"
                      className={`rounded-lg px-2 py-1 text-xs font-medium ${
                        outcome === "defer_next"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                      onClick={() => setOutcome(line.orderItemId, "defer_next")}
                    >
                      В {checklist.nextProcurementName ?? "след. точке"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`rounded-lg px-2 py-1 text-xs font-medium ${
                      outcome === "unavailable"
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    onClick={() => setOutcome(line.orderItemId, "unavailable")}
                  >
                    Нет в наличии
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {!checklist.hasNextProcurementPoint ? (
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-600">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          Если товара нет — покупателю вернутся деньги и придёт уведомление.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {checklist.items.length > 0 ? (
          <Button
            variant="secondary"
            className="flex-1"
            disabled={!allMarked || submit.isPending}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? "Сохранение…" : "Сохранить чек-лист"}
          </Button>
        ) : null}
        <Button
          className="flex-1"
          disabled={
            depart.isPending ||
            (checklist.items.length > 0 && !saved)
          }
          onClick={() => depart.mutate()}
        >
          <Truck size={16} className="mr-2" />
          {depart.isPending ? "…" : "В пути"}
        </Button>
      </div>

      {submit.isError ? (
        <p className="mt-2 text-xs text-red-600">
          {(submit.error as Error)?.message ?? "Ошибка сохранения"}
        </p>
      ) : null}
    </Card>
  )
}
