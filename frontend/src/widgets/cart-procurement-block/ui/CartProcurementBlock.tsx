import { useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { LogOut, MapPin, Package, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurementsEnriched,
  useJoinProcurement,
  useLeaveProcurement,
} from "@/entities/procurement/api/useProcurements"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useProcurementParticipation } from "@/features/procurement/hooks/useProcurementParticipation"
import { LeaveProcurementPanel } from "@/features/procurement/ui/LeaveProcurementPanel"
import { useCartStore } from "@/features/cart/model/cart-store"
import { ApiError } from "@/shared/api/client"
import { routes } from "@/shared/config/routes"
import { useUserDeliverySettlement } from "@/shared/hooks/useUserDeliverySettlement"
import { isProcurementEligibleForUser } from "@/shared/lib/procurement-eligibility"
import { resolveProcurementRouteTitle } from "@/shared/lib/procurement-route-title"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { ActiveProcurementBanner } from "@/widgets/active-procurement-banner/ui/ActiveProcurementBanner"

type Props = {
  /** Встроенный режим — без отдельных карточек, для единой панели корзины */
  embedded?: boolean
  settlementName?: string | null
}

const SectionDivider = () => (
  <div className="my-4 border-t border-slate-100 dark:border-slate-800" />
)

export const CartProcurementBlock = ({ embedded, settlementName }: Props) => {
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setProcurement = useCartStore((s) => s.setProcurement)
  const {
    procurementId,
    procurement,
    joinedRoundIds,
    hasJoined,
    isRoundOpen,
    roundClosed,
    isAuthenticated,
  } = useProcurementParticipation()

  const { data: activeProcurements } = useActiveProcurementsEnriched()
  const { user: deliveryUser, settlementName: profileSettlement } =
    useUserDeliverySettlement()
  const join = useJoinProcurement(user?.id)
  const leave = useLeaveProcurement(user?.id)
  const clearProcurement = useCartStore((s) => s.clearProcurement)
  const { pushDraftItemsToServer } = useCartActions()

  const deliverySettlement = settlementName ?? profileSettlement

  const joinedOpen =
    activeProcurements?.filter(
      (p) =>
        joinedRoundIds.includes(p.id) &&
        (p.status === "open" || p.status === "closing") &&
        isProcurementEligibleForUser(p, deliveryUser ?? user, deliverySettlement),
    ) ?? []

  const handleJoinSelected = async () => {
    if (!procurementId || !isAuthenticated) return
    await join.mutateAsync(procurementId)
    await pushDraftItemsToServer(procurementId)
  }

  const handleLeaveSelected = async () => {
    if (!procurementId || !isAuthenticated) return
    try {
      await leave.mutateAsync(procurementId)
      clearProcurement()
      setLeaveError(null)
      setLeaveConfirmOpen(false)
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Не удалось выйти из сбора"
      setLeaveError(msg)
    }
  }

  const handleSelectRound = (id: string) => {
    setProcurement(id)
  }

  const wrap = (content: ReactNode) =>
    embedded ? content : <Card className="w-full p-4">{content}</Card>

  const leaveButton = (
    <Button
      type="button"
      variant="outline"
      fullWidth
      leftIcon={<LogOut size={16} />}
      className="border-amber-200 text-amber-900 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-900/60 dark:text-amber-200 dark:hover:bg-amber-950/40"
      onClick={() => setLeaveConfirmOpen(true)}
    >
      Выйти из сбора
    </Button>
  )

  if (!isAuthenticated) {
    return wrap(
      <AlertBanner variant="info" title="Войдите для оформления">
        <Link to={routes.auth} className="ui-link font-semibold underline">
          Авторизация
        </Link>{" "}
        нужна, чтобы вступить в сбор и оплатить заказ.
      </AlertBanner>,
    )
  }

  if (!procurementId) {
    return wrap(
      <>
        <div className="flex items-start gap-3">
          <span className="ui-icon-well flex h-10 w-10 shrink-0">
            <Truck size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Сбор не выбран
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Одна корзина на все сборы. Выберите сбор — товары сохранятся.
            </p>
          </div>
        </div>
        {joinedOpen.length > 0 ? (
          <label className="mt-4 block text-xs font-medium text-slate-500">
            Ваши сборы
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value=""
              onChange={(e) => {
                if (e.target.value) handleSelectRound(e.target.value)
              }}
            >
              <option value="">Выберите сбор</option>
              {joinedOpen.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Button
          type="button"
          fullWidth
          className="mt-3"
          onClick={() => navigate(routes.user.activeProcurements)}
        >
          Перейти к сборам
        </Button>
      </>,
    )
  }

  if (roundClosed) {
    return wrap(
      <>
        <p className="text-sm font-semibold text-slate-900">Сбор закрыт</p>
        <p className="mt-2 text-sm text-slate-500">
          {procurement?.title ?? "Выбранный сбор"} больше не принимает заказы.
        </p>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className="mt-3"
          onClick={() => navigate(routes.user.activeProcurements)}
        >
          Открытые сборы
        </Button>
      </>,
    )
  }

  if (!hasJoined) {
    return wrap(
      <>
        <p className="text-sm font-semibold text-slate-900">
          {procurement?.title ?? "Выбранный сбор"}
        </p>
        {procurement ? (
          <p className="mt-1 text-xs text-slate-500">
            Маршрут: {resolveProcurementRouteTitle(procurement)}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-500">
          Вступите в сбор, чтобы оформить заказ.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            type="button"
            fullWidth
            loading={join.isPending}
            leftIcon={<Package size={18} />}
            onClick={() => void handleJoinSelected()}
          >
            Вступить в этот сбор
          </Button>
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => navigate(routes.user.activeProcurements)}
          >
            Другой сбор
          </Button>
        </div>
      </>,
    )
  }

  if (!procurement || !isRoundOpen) {
    return null
  }

  const routeTitle = resolveProcurementRouteTitle(procurement)

  return wrap(
    <div className="flex flex-col gap-3">
      {leaveError ? (
        <AlertBanner variant="warning" title="Выйти нельзя">
          {leaveError}
        </AlertBanner>
      ) : null}

      <ActiveProcurementBanner procurement={procurement} embedded={embedded} />

      <div className="text-xs text-slate-500">
        <p>
          <span className="font-medium text-slate-600">Маршрут:</span> {routeTitle}
        </p>
        {procurement.driverName ? (
          <p className="mt-1">
            <span className="font-medium text-slate-600">Водитель:</span>{" "}
            {procurement.driverName}
            {procurement.vehicleSummary ? ` · ${procurement.vehicleSummary}` : ""}
          </p>
        ) : null}
      </div>

      {joinedOpen.length > 1 ? (
        <label className="block text-xs font-medium text-slate-500">
          Сбор для заказа
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            value={procurementId}
            onChange={(e) => handleSelectRound(e.target.value)}
          >
            {joinedOpen.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {embedded && deliverySettlement ? (
        <>
          <SectionDivider />
          <div className="flex items-start gap-3">
            <span className="ui-icon-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <MapPin size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">Посёлок доставки</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {deliverySettlement}
              </p>
              <Link to={routes.user.addresses} className="ui-link mt-1 inline-block text-xs">
                Изменить
              </Link>
            </div>
          </div>
        </>
      ) : null}

      {leaveConfirmOpen ? (
        <LeaveProcurementPanel
          procurementTitle={procurement.title}
          loading={leave.isPending}
          onConfirm={() => void handleLeaveSelected()}
          onCancel={() => setLeaveConfirmOpen(false)}
        />
      ) : (
        leaveButton
      )}

      <Link
        to={routes.user.activeProcurements}
        className="ui-link text-center text-xs hover:underline"
      >
        Все сборы
      </Link>
    </div>,
  )
}
