import { Link, useNavigate } from "react-router-dom"
import { Package, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurements,
  useJoinProcurement,
} from "@/entities/procurement/api/useProcurements"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useProcurementParticipation } from "@/features/procurement/hooks/useProcurementParticipation"
import { useCartStore } from "@/features/cart/model/cart-store"
import { routes } from "@/shared/config/routes"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { ProcurementProgress } from "@/widgets/procurement-progress/ui/ProcurementProgress"

export const CartProcurementBlock = () => {
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

  const { data: activeProcurements } = useActiveProcurements()
  const join = useJoinProcurement(user?.id)
  const { pushDraftItemsToServer } = useCartActions()

  const joinedOpen =
    activeProcurements?.filter(
      (p) => joinedRoundIds.includes(p.id) && p.status === "open",
    ) ?? []

  const handleJoinSelected = async () => {
    if (!procurementId || !isAuthenticated) return
    await join.mutateAsync(procurementId)
    await pushDraftItemsToServer(procurementId)
  }

  const handleSelectRound = (id: string) => {
    setProcurement(id)
  }

  if (!isAuthenticated) {
    return (
      <AlertBanner variant="info" title="Войдите для оформления">
        <Link to={routes.auth} className="font-semibold text-blue-700 underline">
          Авторизация
        </Link>{" "}
        нужна, чтобы вступить в сбор и оплатить заказ.
      </AlertBanner>
    )
  }

  if (!procurementId) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 !p-4">
        <div className="flex items-start gap-3">
          <Truck size={22} className="shrink-0 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Сбор не выбран</p>
            <p className="mt-1 text-sm text-slate-600">
              Вступите в сбор, чтобы оформить заказ. Товары в корзине сохранятся.
            </p>
            {joinedOpen.length > 0 ? (
              <div className="mt-3">
                <label className="text-xs font-medium text-slate-500">Ваши сборы</label>
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
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
              </div>
            ) : null}
            <Button
              type="button"
              fullWidth
              className="mt-3"
              onClick={() => navigate(routes.activeProcurements)}
            >
              Перейти к сборам
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (roundClosed) {
    return (
      <Card className="border-slate-200 bg-slate-50 !p-4">
        <p className="text-sm font-semibold text-slate-900">Сбор закрыт</p>
        <p className="mt-1 text-sm text-slate-600">
          {procurement?.title ?? "Выбранный сбор"} больше не принимает заказы. Выберите другой
          открытый сбор.
        </p>
        <Button
          type="button"
          variant="outline"
          fullWidth
          className="mt-3"
          onClick={() => navigate(routes.activeProcurements)}
        >
          Открытые сборы
        </Button>
      </Card>
    )
  }

  if (!hasJoined) {
    return (
      <Card className="border-blue-100 bg-blue-50/50 !p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Сбор</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {procurement?.title ?? "Выбранный сбор"}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Вступите в сбор, чтобы перейти к оформлению заказа.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
            onClick={() => navigate(routes.activeProcurements)}
          >
            Другой сбор
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-blue-100 bg-blue-50/50 !p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Сбор · вы участвуете
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {procurement?.title ?? "—"}
          </p>
        </div>
        {joinedOpen.length > 1 ? (
          <select
            className="max-w-[45%] shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
            value={procurementId}
            onChange={(e) => handleSelectRound(e.target.value)}
          >
            {joinedOpen.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {procurement && isRoundOpen ? (
        <div className="mt-3">
          <ProcurementProgress procurement={procurement} size="sm" />
        </div>
      ) : null}
      <Link
        to={routes.activeProcurements}
        className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
      >
        Все сборы
      </Link>
    </Card>
  )
}
