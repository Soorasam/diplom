import { useMemo, useState } from "react"
import { Eye, Plus, Trash2 } from "lucide-react"

import type { LocationCatalogItem } from "@/entities/route/api/driverRoutesApi"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { cn } from "@/shared/lib/cn"
import { randomId } from "@/shared/lib/random-id"

export type RouteBuilderRow = {
  key: string
  settlementId: string
  isProcurementPoint: boolean
}

type Props = {
  settlements: LocationCatalogItem[]
  rows: RouteBuilderRow[]
  onChange: (rows: RouteBuilderRow[]) => void
  /** Подсветить незаполненные пункты (после попытки создать сбор) */
  showErrors?: boolean
}

const selectClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"

export const createEmptyRouteRow = (isFirst: boolean): RouteBuilderRow => ({
  key: randomId(),
  settlementId: "",
  isProcurementPoint: isFirst,
})

export const RouteBuilder = ({ settlements, rows, onChange, showErrors }: Props) => {
  const [settlementPreviewId, setSettlementPreviewId] = useState<string | null>(null)

  const usedIds = useMemo(
    () => new Set(rows.map((r) => r.settlementId).filter(Boolean)),
    [rows],
  )

  const updateRow = (key: string, patch: Partial<RouteBuilderRow>) => {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const addRow = () => {
    onChange([...rows, createEmptyRouteRow(false)])
  }

  const removeRow = (key: string) => {
    if (rows.length <= 1) return
    onChange(rows.filter((r) => r.key !== key))
  }

  return (
    <Card className="border-slate-200">
      <p className="text-sm font-semibold text-slate-900">Маршрут завоза</p>
      <p className="mt-1 text-xs text-slate-500">
        Первая точка — закупка. Добавляйте населённые пункты по порядку следования.
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((row, index) => {
          const isStart = index === 0
          const settlement = settlements.find((s) => s.id === row.settlementId)

          return (
            <li
              key={row.key}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <span className="mb-1 block text-[11px] font-medium text-slate-500">
                  {isStart ? "Начальная точка (закупка)" : `Пункт ${index + 1}`}
                </span>
                <select
                  value={row.settlementId}
                  onChange={(e) =>
                    updateRow(row.key, { settlementId: e.target.value })
                  }
                  className={cn(
                    selectClass,
                    showErrors &&
                      !row.settlementId &&
                      "border-amber-400 ring-2 ring-amber-400/25",
                  )}
                  aria-invalid={showErrors && !row.settlementId}
                >
                  <option value="">Выберите населённый пункт</option>
                  {settlements.map((s) => {
                    const taken = usedIds.has(s.id) && s.id !== row.settlementId
                    return (
                      <option key={s.id} value={s.id} disabled={taken}>
                        {s.name}
                        {s.ulus ? ` · ${s.ulus}` : ""}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!isStart ? (
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={row.isProcurementPoint}
                      onChange={(e) =>
                        updateRow(row.key, {
                          isProcurementPoint: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Точка закупа
                  </label>
                ) : (
                  <span className="rounded-lg bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-800">
                    Закупка
                  </span>
                )}

                {settlement ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Адрес посёлка"
                    onClick={() =>
                      setSettlementPreviewId(
                        settlementPreviewId === settlement.id ? null : settlement.id,
                      )
                    }
                  >
                    <Eye size={18} />
                  </Button>
                ) : null}

                {!isStart ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Удалить пункт"
                    onClick={() => removeRow(row.key)}
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </Button>
                ) : null}
              </div>

              {settlementPreviewId === settlement?.id && settlement ? (
                <div className="w-full basis-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">{settlement.name}</p>
                  {settlement.address ? (
                    <p className="mt-1">{settlement.address}</p>
                  ) : (
                    <p className="mt-1 text-slate-400">Адрес не указан</p>
                  )}
                  {settlement.phone ? <p className="mt-0.5">{settlement.phone}</p> : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        leftIcon={<Plus size={16} />}
        onClick={addRow}
      >
        Добавить пункт
      </Button>

      {getRouteTitleFromRows(rows, settlements) ? (
        <p className={cn("mt-3 text-xs text-slate-500")}>
          Маршрут: {getRouteTitleFromRows(rows, settlements)}
        </p>
      ) : null}
    </Card>
  )
}

export const rowsToWaypoints = (rows: RouteBuilderRow[]) =>
  rows.map((r, index) => ({
    pickupPointId: r.settlementId,
    sortOrder: index,
    isProcurementPoint: index === 0 ? true : r.isProcurementPoint,
  }))

export const getRouteTitleFromRows = (
  rows: RouteBuilderRow[],
  settlements: LocationCatalogItem[],
): string =>
  rows
    .filter((r) => r.settlementId)
    .map((r) => settlements.find((s) => s.id === r.settlementId)?.name)
    .filter(Boolean)
    .join(" → ")

export const validateRouteRows = (rows: RouteBuilderRow[]): string | null => {
  if (rows.length < 1) return "Добавьте хотя бы одну точку маршрута"
  if (rows.some((r) => !r.settlementId.trim())) {
    return "Выберите населённый пункт для каждого пункта маршрута"
  }
  if (rows.length < 2) return "Добавьте хотя бы ещё один населённый пункт"
  const ids = rows.map((r) => r.settlementId)
  if (new Set(ids).size !== ids.length) return "Пункты маршрута не должны повторяться"
  return null
}
