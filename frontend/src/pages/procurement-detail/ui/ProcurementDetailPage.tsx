import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowRight, Map, Package } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useJoinProcurement,
  useLeaveProcurement,
  useMyProcurementMemberships,
  useProcurement,
} from "@/entities/procurement/api/useProcurements"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useCartStore } from "@/features/cart/model/cart-store"
import { participateInProcurement } from "@/features/procurement/lib/participate-in-procurement"
import { LeaveProcurementPanel } from "@/features/procurement/ui/LeaveProcurementPanel"
import { driverRoutesApi } from "@/entities/route/api/driverRoutesApi"
import { routes } from "@/shared/config/routes"
import { formatShortDate } from "@/shared/lib/format"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { StickyActionBar } from "@/shared/ui/sticky-action-bar/StickyActionBar"
import { MapView } from "@/shared/ui/map/MapView"
import { ProcurementCard } from "@/widgets/procurement-card/ui/ProcurementCard"

export const ProcurementDetailPage = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setProcurement = useCartStore((s) => s.setProcurement)
  const clearProcurement = useCartStore((s) => s.clearProcurement)
  const procurementIdInCart = useCartStore((s) => s.procurementId)

  const { data: procurement, isLoading } = useProcurement(id)
  const { data: routePlan, isLoading: loadingRoutePlan } = useQuery({
    queryKey: ["route", "eligibility", procurement?.routeId],
    queryFn: () => driverRoutesApi.getRoute(procurement!.routeId),
    enabled: Boolean(procurement?.routeId),
    staleTime: 60_000,
  })
  const { data: memberships = [] } = useMyProcurementMemberships(user?.id)
  const join = useJoinProcurement(user?.id)
  const leave = useLeaveProcurement(user?.id)
  const { pushDraftItemsToServer } = useCartActions()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)

  const hasJoined = memberships.includes(id)
  const isClosing = procurement?.status === "closing"
  const isClosed =
    procurement != null && procurement.status !== "open" && procurement.status !== "closing"
  const atLimit =
    procurement != null && procurement.currentWeightKg >= procurement.targetWeightKg
  const isOwnRound = Boolean(
    user?.id && procurement?.organizerUserId && procurement.organizerUserId === user.id,
  )
  const needsEligibilityCheck = Boolean(user?.pickupPointId || user?.settlementId)
  const inUserRoute = needsEligibilityCheck
    ? Boolean(
        routePlan?.waypoints.some(
          (w) =>
            (user?.pickupPointId && w.pickupPointId === user.pickupPointId) ||
            (user?.settlementId && w.settlementId === user.settlementId),
        ),
      )
    : true

  const handleParticipate = async () => {
    if (!procurement || atLimit) {
      setLimitMessage("Лимит веса сбора достигнут")
      setConfirmOpen(false)
      return
    }
    try {
      if (isAuthenticated) {
        await join.mutateAsync(procurement.id)
        await pushDraftItemsToServer(procurement.id)
      }
      setConfirmOpen(false)
      participateInProcurement(navigate, setProcurement, procurement.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось выбрать сбор"
      setLimitMessage(
        msg.includes("лимит") || msg.includes("Лимит") ? "Лимит веса сбора достигнут" : msg,
      )
      setConfirmOpen(false)
    }
  }

  const handleLeave = async () => {
    if (!procurement || !isAuthenticated) return
    setLimitMessage(null)
    try {
      await leave.mutateAsync(procurement.id)
      if (procurementIdInCart === procurement.id) {
        clearProcurement()
      }
      setLeaveConfirmOpen(false)
    } catch (e) {
      setLimitMessage(e instanceof Error ? e.message : "Не удалось выйти из сбора")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!procurement) {
    return (
      <PageShell>
        <PageHeader title="Сбор не найден" backTo={routes.user.activeProcurements} />
      </PageShell>
    )
  }

  return (
    <>
      <PageShell withStickyFooter className="!pb-36">
        <PageHeader title="Детали сбора" backTo={routes.user.activeProcurements} className="!mb-0" />

        <ProcurementCard procurement={procurement} />

        <Card className="!p-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Закрытие приёма</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {formatShortDate(procurement.closesAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Ориентир доставки</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {formatShortDate(procurement.estimatedDelivery)}
              </dd>
            </div>
          </dl>
        </Card>

        {limitMessage ? <AlertBanner variant="warning">{limitMessage}</AlertBanner> : null}

        <Card className="!p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Map size={18} className="text-blue-600" />
            Маршрут на карте
          </p>
          <MapView
            markers={[
              {
                id: procurement.routeId,
                title: procurement.title,
                coordinates: { lat: 62.03, lng: 129.73 },
                type: "route",
              },
            ]}
            className="h-52 rounded-xl"
          />
        </Card>

        {hasJoined && !isClosed ? (
          <AlertBanner variant="success" title="Вы участвуете в сборе">
            {isClosing
              ? "Сбор скоро закроется — успейте оформить заказ, если ещё не оплатили."
              : "Можно оформлять несколько заказов, пока сбор открыт. Закрытые сборы не принимают новые заказы."}
          </AlertBanner>
        ) : null}
        {isOwnRound && !hasJoined ? (
          <AlertBanner variant="info" title="Ваш сбор">
            Водитель не может участвовать в собственном сборе — управляйте им в интерфейсе
            водителя.
          </AlertBanner>
        ) : null}
        {isClosing && !hasJoined && !isOwnRound ? (
          <AlertBanner variant="info" title="Сбор скоро закроется">
            Успейте участвовать и оформить заказ — приём заказов завершится автоматически по
            таймеру.
          </AlertBanner>
        ) : null}
        {isClosed ? (
          <AlertBanner variant="warning" title="Сбор закрыт">
            Новые заказы в этот сбор недоступны.
          </AlertBanner>
        ) : null}
      </PageShell>

      <StickyActionBar>
        {hasJoined && !isClosed ? (
          <div className="flex w-full flex-col gap-2">
            {leaveConfirmOpen ? (
              <LeaveProcurementPanel
                procurementTitle={procurement.title}
                loading={leave.isPending}
                onConfirm={() => void handleLeave()}
                onCancel={() => setLeaveConfirmOpen(false)}
              />
            ) : (
              <>
                <Button
                  type="button"
                  fullWidth
                  size="lg"
                  rightIcon={<ArrowRight size={18} />}
                  disabled={!inUserRoute || loadingRoutePlan}
                  onClick={() => participateInProcurement(navigate, setProcurement, procurement.id)}
                >
                  {inUserRoute ? "Перейти в каталог" : "Сбор не для вашего посёлка"}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  variant="outline"
                  onClick={() => setLeaveConfirmOpen(true)}
                >
                  Выйти из сбора
                </Button>
              </>
            )}
          </div>
        ) : (
          <Button
            type="button"
            fullWidth
            size="lg"
            disabled={
              !isAuthenticated ||
              atLimit ||
              isClosed ||
              isOwnRound ||
              join.isPending ||
              loadingRoutePlan ||
              !inUserRoute
            }
            leftIcon={<Package size={18} />}
            onClick={() => setConfirmOpen(true)}
          >
            {isOwnRound
              ? "Это ваш сбор"
              : isClosed
                ? "Сбор закрыт"
                : !inUserRoute
                  ? "Сбор не для вашего посёлка"
                : atLimit
                  ? "Лимит веса достигнут"
                  : isClosing
                    ? "Участвовать (осталось мало времени)"
                    : "Участвовать в сборе"}
          </Button>
        )}
      </StickyActionBar>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmOpen(false)}
        >
          <Card
            className="ornament-frame w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-slate-900">Вступление в сбор</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Откроется каталог «{procurement.title}». Добавьте товары, оплатите заказ — тогда
              вес учтётся в прогрессе сбора.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setConfirmOpen(false)}>
                Отмена
              </Button>
              <Button fullWidth loading={join.isPending} onClick={() => void handleParticipate()}>
                {inUserRoute ? "В каталог" : "Недоступно"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  )
}
