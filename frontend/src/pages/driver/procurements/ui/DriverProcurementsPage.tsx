import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, PlusCircle, Truck } from "lucide-react"

import {
  useCloseProcurement,
  useCreateProcurement,
  useAllProcurements,
} from "@/entities/procurement/api/useProcurements"
import { routesApi } from "@/entities/route/api/routesApi"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const DriverProcurementsPage = () => {
  const [title, setTitle] = useState("")
  const [routeId, setRouteId] = useState("")
  const [closesAt, setClosesAt] = useState("")

  const { data: routeList = [], isLoading: loadingRoutes } = useQuery({
    queryKey: ["routes", "all"],
    queryFn: () => routesApi.getAll(),
  })

  const create = useCreateProcurement()
  const close = useCloseProcurement("driver")
  const { data: all = [] } = useAllProcurements()

  const effectiveRouteId = routeId || routeList[0]?.id || ""

  const route = useMemo(
    () => routeList.find((r) => r.id === effectiveRouteId) ?? routeList[0],
    [routeList, effectiveRouteId],
  )

  const canCreate =
    title.trim().length > 5 && Boolean(effectiveRouteId) && Boolean(closesAt)

  return (
    <PageShell>
      <PageHeader title="Мои сборы" subtitle="Водитель создает и закрывает свои сборы" />

      <Card className="ui-panel">
        <p className="text-sm font-semibold text-slate-900">Правило ролей</p>
        <p className="mt-1 text-sm text-slate-600">
          Водитель: создает и закрывает сбор. ПВЗ/админ: подтверждают приемку товара в точках.
        </p>
      </Card>

      {loadingRoutes ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <Card className="border-slate-200">
          <div className="space-y-3">
            <Input
              label="Название сбора"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Якутск → Намцы"
            />

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Маршрут</span>
              <select
                value={effectiveRouteId}
                onChange={(e) => setRouteId(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {routeList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Дедлайн закрытия"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Button
              type="button"
              fullWidth
              disabled={!canCreate || create.isPending}
              leftIcon={<PlusCircle size={16} />}
              onClick={() =>
                create.mutate({
                  title: title.trim(),
                  routeId: effectiveRouteId,
                  closesAt: new Date(closesAt).toISOString(),
                  deliveryMode: route?.deliveryMode ?? "mixed",
                })
              }
            >
              Создать сбор
            </Button>
          </div>
        </Card>
      )}

      {all.length === 0 ? (
        <EmptyState icon={Truck} title="Сборов пока нет" />
      ) : (
        <ul className="flex flex-col gap-2">
          {all.map((p) => (
            <li key={p.id}>
              <Card className="border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500">Дедлайн: {formatShortDate(p.closesAt)}</p>
                  </div>
                  <Badge variant={p.status === "closed" ? "success" : "info"}>{p.status}</Badge>
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    leftIcon={<CheckCircle2 size={16} />}
                    disabled={p.status === "closed" || close.isPending}
                    onClick={() => close.mutate(p.id)}
                  >
                    Закрыть сбор
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
