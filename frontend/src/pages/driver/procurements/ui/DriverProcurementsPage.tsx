import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { routesApi } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"
import {
  isDeliveryRoundInProgress,
  isOpenCollectionRound,
  resolveDriverActiveRoute,
} from "@/shared/lib/driver-round-workload"
import {
  MapPin,
  Package,
  PlusCircle,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react"

import {
  useCreateProcurement,
  useAllProcurements,
  useDriverActiveProcurement,
  useDriverDeliveryProcurement,
  useScheduleEmergencyClose,
} from "@/entities/procurement/api/useProcurements"
import { routes } from "@/shared/config/routes"
import { randomId } from "@/shared/lib/random-id"
import { EmergencyCloseModal } from "@/features/driver-procurement/ui/EmergencyCloseModal"
import {
  driverRoutesApi,
  transportToDeliveryMode,
  type CreateRoutePlanPayload,
} from "@/entities/route/api/driverRoutesApi"
import {
  RouteBuilder,
  createEmptyRouteRow,
  getRouteTitleFromRows,
  rowsToWaypoints,
  validateRouteRows,
  type RouteBuilderRow,
} from "@/features/driver-route/ui/RouteBuilder"
import { getProcurementDisplayStatus } from "@/shared/lib/procurement-status"
import { formatShortDate, formatShortDateTime } from "@/shared/lib/format"
import {
  CLOSES_AT_DATETIME_ERROR,
  getClosesAtDatetimeMax,
  getClosesAtDatetimeMin,
  getClosesAtValidationMessage,
} from "@/shared/lib/validation"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { ProcurementClosingCountdown } from "@/widgets/procurement-closing-countdown/ui/ProcurementClosingCountdown"
import { useAuthStore } from "@/app/model/auth-store"

const transportOptions = [
  { value: "winter_road" as const, label: "Зимник" },
  { value: "river" as const, label: "Речной" },
  { value: "highway" as const, label: "Автодорога" },
]

const initialTransportType: CreateRoutePlanPayload["transportType"] = "winter_road"

const createInitialRows = (): RouteBuilderRow[] => [createEmptyRouteRow(true)]

export const DriverProcurementsPage = () => {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [title, setTitle] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [transportType, setTransportType] =
    useState<CreateRoutePlanPayload["transportType"]>(initialTransportType)
  const [rows, setRows] = useState<RouteBuilderRow[]>(createInitialRows)
  const [formError, setFormError] = useState<string | null>(null)
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)

  const minClosesAt = useMemo(() => getClosesAtDatetimeMin(), [])
  const maxClosesAt = useMemo(() => getClosesAtDatetimeMax(), [])

  const { data: settlements = [], isLoading: loadingSettlements } = useQuery({
    queryKey: ["settlements", "catalog"],
    queryFn: () => driverRoutesApi.getSettlementsCatalog(),
  })

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["driver", "route-templates"],
    queryFn: () => driverRoutesApi.getTemplates(),
  })

  const create = useCreateProcurement()
  const scheduleEmergencyClose = useScheduleEmergencyClose()
  const driverId = user?.role === "driver" ? user.id : ""

  const { data: activeRound } = useDriverActiveProcurement(user?.id)
  const { data: deliveryRound } = useDriverDeliveryProcurement(user?.id)
  const { data: all = [] } = useAllProcurements()

  const { data: driverRoutes } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
    enabled: Boolean(driverId),
  })

  const { data: driverOrders } = useQuery({
    queryKey: [...queryKeys.routes.driver(driverId), "orders"],
    queryFn: () => routesApi.getDriverOrders(driverId),
    enabled: Boolean(driverId),
  })

  const deliveryRoute = useMemo(
    () => resolveDriverActiveRoute(driverRoutes, deliveryRound, activeRound),
    [driverRoutes, deliveryRound, activeRound],
  )

  const hasActiveRound = isOpenCollectionRound(activeRound)
  const hasDeliveryInProgress = isDeliveryRoundInProgress(
    deliveryRound,
    deliveryRoute,
    driverOrders,
  )
  const canCreateNewRound = !hasActiveRound && !hasDeliveryInProgress

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => driverRoutesApi.deleteTemplate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["driver", "route-templates"] })
    },
  })

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setFormError(null)
    setTransportType(t.transportType as CreateRoutePlanPayload["transportType"])
    setRows(
      t.waypoints.map((w) => ({
        key: randomId(),
        settlementId: w.pickupPointId ?? w.settlementId ?? "",
        isProcurementPoint: w.isProcurementPoint,
      })),
    )
  }

  const routeTitlePreview = useMemo(
    () => getRouteTitleFromRows(rows, settlements),
    [rows, settlements],
  )

  const routeValid = validateRouteRows(rows) === null
  const closesAtError = closesAt ? getClosesAtValidationMessage(closesAt) ?? undefined : undefined
  const closesAtValid = Boolean(closesAt) && !closesAtError

  const canCreate = title.trim().length > 3 && closesAtValid && routeValid

  const handleClosesAtChange = (value: string) => {
    setClosesAt(value)
    if (formError === CLOSES_AT_DATETIME_ERROR) setFormError(null)
  }

  const canSaveTemplate = routeValid

  const resetForm = () => {
    setTitle("")
    setClosesAt("")
    setTransportType(initialTransportType)
    setRows(createInitialRows())
    setFormError(null)
  }

  const fillTitleFromRoute = () => {
    if (!routeTitlePreview) return
    setTitle(routeTitlePreview)
  }

  const handleCreate = async () => {
    setFormError(null)
    const routeErr = validateRouteRows(rows)
    if (routeErr) {
      setFormError(routeErr)
      return
    }
    if (!closesAt || getClosesAtValidationMessage(closesAt)) {
      return
    }

    const effectiveTitle = title.trim() || routeTitlePreview || "Новый сбор"

    try {
      const waypoints = rowsToWaypoints(rows)
      await create.mutateAsync({
        title: effectiveTitle,
        closesAt: new Date(closesAt).toISOString(),
        deliveryMode: transportToDeliveryMode(transportType),
        routePlan: {
          title: routeTitlePreview || effectiveTitle,
          transportType,
          waypoints,
        },
      })

      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось создать сбор")
    }
  }

  const handleSaveTemplate = async () => {
    setFormError(null)
    const routeErr = validateRouteRows(rows)
    if (routeErr) {
      setFormError(routeErr)
      return
    }
    try {
      await driverRoutesApi.saveTemplate({
        title: routeTitlePreview || "Мой маршрут",
        transportType,
        waypoints: rowsToWaypoints(rows),
      })
      void qc.invalidateQueries({ queryKey: ["driver", "route-templates"] })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось сохранить шаблон")
    }
  }

  const closedProcurements = useMemo(
    () =>
      [...all]
        .filter((p) => !user?.id || p.organizerUserId === user.id)
        .filter((p) => p.status !== "open" && p.status !== "closing")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [all, user?.id],
  )

  const handleEmergencyClose = async () => {
    if (!activeRound) return
    try {
      await scheduleEmergencyClose.mutateAsync(activeRound.id)
      setEmergencyModalOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось запланировать закрытие")
      setEmergencyModalOpen(false)
    }
  }

  const loading = loadingSettlements || loadingTemplates

  return (
    <PageShell>
      <PageHeader title="Мои сборы" subtitle="Соберите маршрут и откройте сбор заказов" />

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {hasActiveRound && activeRound ? (
            <Card className="border-sky-200 bg-sky-50/40 !p-4 dark:border-sky-900/50 dark:bg-sky-950/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                Текущий сбор
              </p>
              <p className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-slate-100">
                {activeRound.title}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Закрытие: {formatShortDateTime(activeRound.closesAt)}
              </p>
              {activeRound.emergencyCloseAt ? (
                <div className="mt-3">
                  <ProcurementClosingCountdown emergencyCloseAt={activeRound.emergencyCloseAt} />
                  <p className="mt-2 text-xs text-amber-800">
                    Приём заказов завершится автоматически по таймеру.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-600">
                  Одновременно может быть только один активный сбор.
                </p>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Link
                  to={routes.driver.route}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 text-sm font-semibold text-white"
                >
                  <Package size={16} />
                  Заказы жителей
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-slate-500"
                  disabled={Boolean(activeRound.emergencyCloseAt) || scheduleEmergencyClose.isPending}
                  onClick={() => setEmergencyModalOpen(true)}
                >
                  {activeRound.emergencyCloseAt
                    ? "Закрытие запланировано"
                    : "Закрыть досрочно…"}
                </Button>
              </div>
            </Card>
          ) : null}

          {hasDeliveryInProgress && deliveryRound ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  to={routes.driver.route}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <Package size={16} />
                  Заказы по посёлкам
                </Link>
                <Link
                  to={routes.driver.route}
                  className="ui-cta-primary inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                >
                  <MapPin size={16} />
                  Рейс
                </Link>
              </div>
            </>
          ) : null}

          {canCreateNewRound ? (
            <>
          <RouteBuilder settlements={settlements} rows={rows} onChange={setRows} />

          <Card className="border-slate-200">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Input
                    label="Название сбора"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={routeTitlePreview || "Например: Рейс в Томпонский улус"}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 sm:mb-0.5"
                  leftIcon={<Sparkles size={16} />}
                  disabled={!routeTitlePreview}
                  onClick={fillTitleFromRoute}
                >
                  По маршруту
                </Button>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Тип доставки
                </span>
                <select
                  value={transportType}
                  onChange={(e) =>
                    setTransportType(e.target.value as CreateRoutePlanPayload["transportType"])
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {transportOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label="Дата и время закрытия"
                type="datetime-local"
                min={minClosesAt}
                max={maxClosesAt}
                value={closesAt}
                error={closesAtError}
                onChange={(e) => handleClosesAtChange(e.target.value)}
                onBlur={(e) => handleClosesAtChange(e.target.value)}
              />
            </div>
          </Card>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              fullWidth
              disabled={!canCreate || create.isPending}
              leftIcon={<PlusCircle size={16} />}
              onClick={() => void handleCreate()}
            >
              Создать сбор
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={!canSaveTemplate}
              leftIcon={<Save size={16} />}
              onClick={() => void handleSaveTemplate()}
            >
              Сохранить маршрут
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              leftIcon={<RotateCcw size={16} />}
              className="border-slate-200 text-slate-600 transition-all duration-200 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm active:scale-[0.99] [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:-rotate-90"
              onClick={resetForm}
            >
              Сбросить
            </Button>
          </div>
            </>
          ) : null}

          {canCreateNewRound && templates.length > 0 ? (
            <Card className="border-slate-200">
              <p className="text-sm font-semibold text-slate-900">Сохранённые маршруты</p>
              <p className="mt-1 text-xs text-slate-500">
                Подставить копирует маршрут в форму — его можно изменить перед созданием сбора.
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {templates.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-500">{t.waypoints.length} пунктов</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => applyTemplate(t.id)}
                      >
                        Подставить
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => deleteTemplate.mutate(t.id)}
                        disabled={deleteTemplate.isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}

      <EmergencyCloseModal
        open={emergencyModalOpen}
        loading={scheduleEmergencyClose.isPending}
        onCancel={() => setEmergencyModalOpen(false)}
        onConfirm={() => void handleEmergencyClose()}
      />

      {closedProcurements.length > 0 ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Завершённые сборы
          </p>
          <ul className="flex flex-col gap-2">
            {closedProcurements.map((p) => {
              const display = getProcurementDisplayStatus(p)
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {p.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatShortDate(p.createdAt)} · закрытие {formatShortDateTime(p.closesAt)}
                    </p>
                  </div>
                  <Badge
                    variant={display.variant}
                    title={display.label}
                    className="max-w-[4.5rem] truncate text-[10px] px-1.5"
                  >
                    {display.shortLabel}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </>
      ) : !hasActiveRound && !hasDeliveryInProgress && !loading ? (
        <EmptyState icon={Truck} title="Сборов пока нет" />
      ) : null}
    </PageShell>
  )
}
