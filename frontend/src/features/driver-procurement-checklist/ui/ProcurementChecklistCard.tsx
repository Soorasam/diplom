import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ShoppingCart, Truck, X } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  procurementChecklistApi,
  type ProcurementChecklistLine,
  type ProcurementOutcome,
} from "@/entities/driver-procurement/api/procurementChecklistApi"
import { usePurchaseSettlement } from "@/entities/procurement-settlement/api/useProcurementSettlement"
import { ProcurementSettlementCard } from "@/features/driver-procurement-settlement/ui/ProcurementSettlementCard"
import { ProcurementStopReceiptsCard } from "@/features/driver-procurement-settlement/ui/ProcurementStopReceiptsCard"
import { useProcurementStopReceipts } from "@/entities/procurement-settlement/api/useProcurementSettlement"
import { invalidateDriverWorkbench } from "@/shared/lib/invalidate-driver-workbench"
import { cn } from "@/shared/lib/cn"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"

type Props = {
  roundId: string
  onProgress?: (purchased: number, total: number) => void
  compact?: boolean
}

type SortMode = "positions" | "residents"

const groupByResident = (items: ProcurementChecklistLine[]) => {
  const map = new Map<string, { residentId: string; name: string; lines: ProcurementChecklistLine[] }>()
  for (const line of items) {
    const key = line.residentId || line.residentName
    if (!map.has(key)) {
      map.set(key, { residentId: key, name: line.residentName, lines: [] })
    }
    map.get(key)!.lines.push(line)
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"))
}

const formatResidentSummary = (lines: ProcurementChecklistLine[]) => {
  const agg = new Map<string, { name: string; qty: number }>()
  for (const line of lines) {
    const cur = agg.get(line.productId)
    if (cur) cur.qty += line.quantity
    else agg.set(line.productId, { name: line.productName, qty: line.quantity })
  }
  return [...agg.values()]
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .map(({ name, qty }) => `${name}${qty > 1 ? ` ×${qty}` : ""}`)
    .join(", ")
}

const ChecklistLineRow = ({
  line,
  bought,
  unavailable,
  onTogglePurchased,
  onMarkUnavailable,
  groupedByResident,
}: {
  line: ProcurementChecklistLine
  bought: boolean
  unavailable: boolean
  onTogglePurchased: (id: string) => void
  onMarkUnavailable: (id: string) => void
  groupedByResident?: boolean
}) => (
  <div
    className={cn(
      "rounded-xl border p-3 transition-colors",
      bought && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/20",
      unavailable && "border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20",
      !bought && !unavailable && "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40",
    )}
  >
    <button
      type="button"
      className="flex w-full items-start gap-3 text-left"
      onClick={() => onTogglePurchased(line.orderItemId)}
    >
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
          bought
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900",
        )}
      >
        {bought ? <Check size={14} strokeWidth={3} /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900 dark:text-slate-100">
          {line.productName}
          {line.quantity > 1 ? (
            <span className="text-slate-500"> ×{line.quantity}</span>
          ) : null}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {line.unit}
          {groupedByResident
            ? ` · заказ ${line.orderNumber} → ${line.deliverySettlementName}`
            : ` · ${line.residentName} → ${line.deliverySettlementName}`}
        </p>
      </div>
    </button>
    {!bought ? (
      <button
        type="button"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400"
        onClick={() => onMarkUnavailable(line.orderItemId)}
      >
        <X size={12} />
        {unavailable ? "Отменить «нет в наличии»" : "Нет в наличии"}
      </button>
    ) : null}
  </div>
)

export const ProcurementChecklistCard = ({
  roundId,
  onProgress,
  compact,
}: Props) => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : ""
  const qc = useQueryClient()
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set())
  const [checklistSaved, setChecklistSaved] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>("positions")

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["driver", "procurement-checklist", roundId],
    queryFn: () => procurementChecklistApi.getActive(roundId),
    enabled: Boolean(roundId),
  })

  const checklist = data?.active ? data : null

  useEffect(() => {
    setPurchasedIds(new Set())
    setUnavailableIds(new Set())
    setChecklistSaved(false)
    setSortMode("positions")
  }, [checklist?.pickupPointId])

  const totalPositions = checklist?.items.length ?? 0
  const markedCount = purchasedIds.size + unavailableIds.size
  const requiresSettlement = checklist ? !checklist.hasNextProcurementPoint : false

  const { data: settlement } = usePurchaseSettlement(
    requiresSettlement ? roundId : undefined,
  )
  const settlementDone = Boolean(settlement?.purchaseSettledAt)

  const { data: stopReceipts = [] } = useProcurementStopReceipts(
    roundId,
    checklist?.pickupPointId,
  )
  const hasReceipt = stopReceipts.length > 0

  const residentGroups = useMemo(
    () => (checklist ? groupByResident(checklist.items) : []),
    [checklist],
  )

  useEffect(() => {
    onProgress?.(purchasedIds.size, totalPositions)
  }, [purchasedIds.size, totalPositions, onProgress])

  const syncWorkbench = () => {
    invalidateDriverWorkbench(qc, driverId)
    void qc.invalidateQueries({ queryKey: ["procurement-settlement", roundId] })
    void refetch()
  }

  const submit = useMutation({
    mutationFn: () => {
      if (!checklist) throw new Error("no checklist")
      const items = checklist.items.map((line) => {
        let outcome: ProcurementOutcome = "unavailable"
        if (purchasedIds.has(line.orderItemId)) outcome = "purchased"
        else if (unavailableIds.has(line.orderItemId)) outcome = "unavailable"
        return { orderItemId: line.orderItemId, outcome }
      })
      return procurementChecklistApi.submit(roundId, checklist.pickupPointId, items)
    },
    onSuccess: () => {
      setChecklistSaved(true)
      syncWorkbench()
    },
  })

  const depart = useMutation({
    mutationFn: () => {
      if (!checklist) throw new Error("no checklist")
      return procurementChecklistApi.depart(roundId, checklist.pickupPointId)
    },
    onSuccess: () => {
      setPurchasedIds(new Set())
      setUnavailableIds(new Set())
      setChecklistSaved(false)
      syncWorkbench()
    },
  })

  const togglePurchased = (orderItemId: string) => {
    setChecklistSaved(false)
    setUnavailableIds((prev) => {
      const next = new Set(prev)
      next.delete(orderItemId)
      return next
    })
    setPurchasedIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderItemId)) next.delete(orderItemId)
      else next.add(orderItemId)
      return next
    })
  }

  const markUnavailable = (orderItemId: string) => {
    setChecklistSaved(false)
    setPurchasedIds((prev) => {
      const next = new Set(prev)
      next.delete(orderItemId)
      return next
    })
    setUnavailableIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderItemId)) next.delete(orderItemId)
      else next.add(orderItemId)
      return next
    })
  }

  const allMarked = totalPositions > 0 && markedCount === totalPositions
  const checklistDone = checklistSaved || totalPositions === 0
  const canDepart =
    Boolean(checklist) &&
    checklistDone &&
    hasReceipt &&
    (!requiresSettlement || settlementDone)

  if (isLoading) {
    return (
      <Card className="flex justify-center py-8">
        <Spinner />
      </Card>
    )
  }

  if (!checklist || (checklist.procurementCompleted && checklist.items.length === 0)) {
    return null
  }

  if (checklist.procurementCompleted) {
    return null
  }

  return (
    <Card className={cn("border-amber-200/80", compact ? "!p-3" : "!p-4")}>
      {!compact ? (
        <div className="mb-4 flex items-center gap-3">
          <span className="ui-icon-soft h-10 w-10 shrink-0">
            <ShoppingCart size={20} />
          </span>
          <div>
            <p className="text-xs font-medium text-slate-500">Чек-лист закупки</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {checklist.locationName}
            </p>
          </div>
        </div>
      ) : null}

      {checklist.items.length > 0 ? (
        <div className="mb-3 flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900/50">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              sortMode === "positions"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400",
            )}
            onClick={() => setSortMode("positions")}
          >
            По позициям
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              sortMode === "residents"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400",
            )}
            onClick={() => setSortMode("residents")}
          >
            По жителям
          </button>
        </div>
      ) : null}

      {checklist.items.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          На этой точке нечего закупать.
        </p>
      ) : sortMode === "positions" ? (
        <ul className="flex flex-col gap-2">
          {checklist.items.map((line) => (
            <li key={line.orderItemId}>
              <ChecklistLineRow
                line={line}
                bought={purchasedIds.has(line.orderItemId)}
                unavailable={unavailableIds.has(line.orderItemId)}
                onTogglePurchased={togglePurchased}
                onMarkUnavailable={markUnavailable}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-3">
          {residentGroups.map((group) => (
            <li
              key={group.residentId}
              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/40"
            >
              <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
                {group.name}
              </p>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                {formatResidentSummary(group.lines)}
              </p>
              <ul className="flex flex-col gap-2">
                {group.lines.map((line) => (
                  <li key={line.orderItemId}>
                    <ChecklistLineRow
                      line={line}
                      bought={purchasedIds.has(line.orderItemId)}
                      unavailable={unavailableIds.has(line.orderItemId)}
                      onTogglePurchased={togglePurchased}
                      onMarkUnavailable={markUnavailable}
                      groupedByResident
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {checklistDone ? (
        <ProcurementStopReceiptsCard
          roundId={roundId}
          pickupPointId={checklist.pickupPointId}
          locationName={checklist.locationName}
        />
      ) : null}

      {requiresSettlement && checklistDone && hasReceipt ? (
        <div className="mt-4">
          <ProcurementSettlementCard roundId={roundId} embedded />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {checklist.items.length > 0 ? (
          <Button
            type="button"
            fullWidth
            disabled={!allMarked || submit.isPending}
            onClick={() => submit.mutate()}
          >
            {submit.isPending
              ? "Сохранение…"
              : `Готово · ${markedCount}/${totalPositions} позиций`}
          </Button>
        ) : null}
        <Button
          type="button"
          fullWidth
          className="ui-cta-primary"
          disabled={depart.isPending || !canDepart}
          onClick={() => depart.mutate()}
        >
          <Truck size={16} className="mr-2" />
          {depart.isPending ? "…" : "Поехали"}
        </Button>
        {checklistDone && !hasReceipt ? (
          <p className="text-center text-xs text-amber-700 dark:text-amber-300">
            Прикрепите фото чека с этой точки закупки
          </p>
        ) : null}
        {requiresSettlement && checklistDone && hasReceipt && !settlementDone ? (
          <p className="text-center text-xs text-amber-700 dark:text-amber-300">
            Укажите итоговую сумму по всем чекам и проведите сверку
          </p>
        ) : null}
      </div>

      {submit.isError ? (
        <p className="mt-2 text-xs text-red-600">
          {(submit.error as Error)?.message ?? "Ошибка сохранения"}
        </p>
      ) : null}
      {depart.isError ? (
        <p className="mt-2 text-xs text-red-600">
          {(depart.error as Error)?.message ?? "Не удалось выехать"}
        </p>
      ) : null}
    </Card>
  )
}
