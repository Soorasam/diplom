import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowRight, Map, Package } from "lucide-react"

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
import { routes } from "@/shared/config/routes"
import { isProcurementEligibleForUser } from "@/shared/lib/procurement-eligibility"
import { useUserDeliverySettlement } from "@/shared/hooks/useUserDeliverySettlement"
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
import { ProcurementLogisticsCard } from "@/widgets/procurement-logistics/ui/ProcurementLogisticsCard"

export const ProcurementDetailPage = () => {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { user, locationId: userLocationId, settlementName } = useUserDeliverySettlement()
  const setProcurement = useCartStore((s) => s.setProcurement)
  const clearProcurement = useCartStore((s) => s.clearProcurement)
  const procurementIdInCart = useCartStore((s) => s.procurementId)

  const { data: procurement, isLoading } = useProcurement(id)
  const { data: memberships = [] } = useMyProcurementMemberships(user?.id)
  const join = useJoinProcurement(user?.id)
  const leave = useLeaveProcurement(user?.id)
  const { pushDraftItemsToServer } = useCartActions()

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
  const inUserRoute = userLocationId
    ? procurement
      ? isProcurementEligibleForUser(procurement, user, settlementName)
      : false
    : false

  const handleParticipate = async () => {
    if (!procurement || atLimit) {
      setLimitMessage("Лимит веса сбора достигнут")
      return
    }
    try {
      if (isAuthenticated) {
        await join.mutateAsync(procurement.id)
        await pushDraftItemsToServer(procurement.id)
      }
      participateInProcurement(navigate, setProcurement, procurement.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось выбрать сбор"
      setLimitMessage(
        msg.includes("лимит") || msg.includes("Лимит") ? "Лимит веса сбора достигнут" : msg,
      )
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

        <ProcurementLogisticsCard procurement={procurement} />

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

        {isAuthenticated && !userLocationId ? (
          <AlertBanner variant="warning" title="Укажите населённый пункт">
            <Link to={routes.user.addresses} className="ui-link font-semibold underline">
              Выберите посёлок доставки
            </Link>{" "}
            в профиле, чтобы участвовать в сборе.
          </AlertBanner>
        ) : null}

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
                  disabled={!inUserRoute}
                  onClick={() => participateInProcurement(navigate, setProcurement, procurement.id)}
                >
                  {!userLocationId
                    ? "Укажите посёлок в профиле"
                    : inUserRoute
                      ? "Перейти в каталог"
                      : "Сбор не для вашего посёлка"}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  variant="outline"
                  className="border-amber-200 text-amber-900 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-200 dark:hover:bg-amber-950/40"
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
              !userLocationId ||
              !inUserRoute
            }
            leftIcon={<Package size={18} />}
            onClick={() => void handleParticipate()}
          >
            {isOwnRound
              ? "Это ваш сбор"
              : isClosed
                ? "Сбор закрыт"
                : !userLocationId
                  ? "Укажите посёлок в профиле"
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

    </>
  )
}
