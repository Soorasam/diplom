import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  List,
  Lock,
  Map,
  Package,
} from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useCartStore } from "@/features/cart/model/cart-store"
import { participateInProcurement } from "@/features/procurement/lib/participate-in-procurement"
import {
  useActiveProcurements,
  useJoinProcurement,
  useMyProcurementMemberships,
} from "@/entities/procurement/api/useProcurements"
import type { Procurement } from "@/shared/api/mock-db"
import { routes } from "@/shared/config/routes"
import type { DeliveryMode } from "@/shared/types"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { MapView } from "@/shared/ui/map/MapView"
import { ProcurementCard } from "@/widgets/procurement-card/ui/ProcurementCard"
import { cn } from "@/shared/lib/cn"

type SortKey = "closesAt" | "progress"

export const ActiveProcurementsPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: procurements, isLoading } = useActiveProcurements()
  const { data: memberships = [] } = useMyProcurementMemberships(user?.id)
  const join = useJoinProcurement(user?.id)
  const { pushDraftItemsToServer } = useCartActions()
  const setProcurement = useCartStore((s) => s.setProcurement)

  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryMode | "all">("all")
  const [sort, setSort] = useState<SortKey>("closesAt")
  const [limitMessage, setLimitMessage] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = [...(procurements ?? [])]
    if (deliveryFilter !== "all") {
      list = list.filter((p) => p.deliveryMode === deliveryFilter)
    }
    list.sort((a, b) => {
      if (sort === "progress") {
        return b.currentVolumePercent - a.currentVolumePercent
      }
      return new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime()
    })
    return list
  }, [procurements, deliveryFilter, sort])

  const mapMarkers = filtered.map((p) => ({
    id: p.id,
    title: p.title,
    coordinates: { lat: 62.03 + filtered.indexOf(p) * 0.4, lng: 129.73 },
    type: "route" as const,
  }))

  const handleParticipate = async (p: Procurement) => {
    if (p.currentWeightKg >= p.targetWeightKg) {
      setLimitMessage("Лимит веса сбора достигнут")
      return
    }
    setLimitMessage(null)
    try {
      if (isAuthenticated) {
        await join.mutateAsync(p.id)
        await pushDraftItemsToServer(p.id)
      }
      participateInProcurement(navigate, setProcurement, p.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось выбрать сбор"
      setLimitMessage(msg)
    }
  }

  const chipClass = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition",
      active
        ? "ui-pill-active"
        : "ui-pill-inactive ring-1 ring-subtle/40",
    )

  return (
    <PageShell>
      <PageHeader
        title="Активные сборы"
        subtitle="Участвуйте в сборе — выберите товары в каталоге и оплатите заказ"
        className="!mb-0"
      />

      {!isAuthenticated ? (
        <AlertBanner variant="info" title="Войдите в аккаунт">
          <Link to={routes.auth} className="ui-link font-semibold underline">
            Авторизация
          </Link>{" "}
          нужна для участия в сборе и оформления заказа.
        </AlertBanner>
      ) : null}

      <Card className="!p-3" data-no-swipe>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setViewMode("list")} className={chipClass(viewMode === "list")}>
            <List size={14} />
            Список
          </button>
          <button type="button" onClick={() => setViewMode("map")} className={chipClass(viewMode === "map")}>
            <Map size={14} />
            Карта
          </button>
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value as DeliveryMode | "all")}
            className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">Все маршруты</option>
            <option value="winter_road">Зимник</option>
            <option value="river">Река</option>
            <option value="mixed">Смешанный</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="closesAt">По дате закрытия</option>
            <option value="progress">По заполнению</option>
          </select>
        </div>
      </Card>

      {limitMessage ? (
        <AlertBanner variant="warning">{limitMessage}</AlertBanner>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filtered.length > 0 ? (
        viewMode === "map" ? (
          <Card padding="none" className="overflow-hidden">
            <MapView markers={mapMarkers} className="h-72" />
            <p className="px-4 py-3 text-center text-xs text-slate-500">
              {filtered.length} активных сборов
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {filtered.map((p) => {
              const hasJoined = memberships.includes(p.id)
              const atLimit = p.currentWeightKg >= p.targetWeightKg
              return (
                <li key={p.id}>
                  <Card className="overflow-hidden !p-0">
                    <Link
                      to={routes.procurement(p.id)}
                      className="group block p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <ProcurementCard procurement={p} embedded />
                      <span className="ui-link mt-2 inline-flex items-center gap-1 text-xs group-hover:underline">
                        Подробнее о сборе
                        <ChevronRight size={14} />
                      </span>
                    </Link>
                    <div className="border-t border-slate-200/80 p-4 dark:border-slate-700/60">
                      {hasJoined ? (
                        <div className="flex items-center justify-between gap-2">
                          <p className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={16} className="shrink-0" />
                            Участвуете
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="!min-h-9 shrink-0 px-3"
                            rightIcon={<ArrowRight size={14} />}
                            onClick={() => participateInProcurement(navigate, setProcurement, p.id)}
                          >
                            Каталог
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          fullWidth
                          size="lg"
                          disabled={!isAuthenticated || atLimit || join.isPending}
                          leftIcon={
                            !isAuthenticated ? <Lock size={18} /> : <Package size={18} />
                          }
                          onClick={() => void handleParticipate(p)}
                        >
                          {atLimit ? "Лимит веса достигнут" : "Участвовать в сборе"}
                        </Button>
                      )}
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )
      ) : (
        <EmptyState
          icon={Package}
          title="Сборов пока нет"
          description="Новые сборы появятся здесь"
        />
      )}
    </PageShell>
  )
}
