import { Link } from "react-router-dom"
import { Check, User } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useDriverApplicationDraftStore } from "@/features/driver-application/model/driver-application-draft-store"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { routes } from "@/shared/config/routes"
import { isValidFullName, normalizeRuPhone } from "@/shared/lib/validation"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  canContinue: boolean
  profileComplete: boolean
  onContinue: () => void
}

export const ConsentStep = ({ canContinue, profileComplete, onContinue }: Props) => {
  const user = useAuthStore((s) => s.user)
  const profileRoutes = useProfileRoutes()
  const termsAccepted = useDriverApplicationDraftStore((s) => s.draft.termsAccepted)
  const setTermsAccepted = useDriverApplicationDraftStore((s) => s.setTermsAccepted)

  return (
    <div className="flex flex-col gap-3">
      <Card className="border-slate-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <User size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Данные из профиля</p>
            <p className="mt-1 text-xs text-slate-500">
              В заявку подставятся данные вашего аккаунта. Изменить их можно в профиле.
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">ФИО</dt>
                <dd className="font-medium text-slate-900">{user?.name?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Телефон</dt>
                <dd className="font-medium text-slate-900">{user?.phone?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">{user?.email?.trim() || "—"}</dd>
              </div>
            </dl>
            {!profileComplete ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Заполните ФИО и телефон в профиле, затем вернитесь к заявке.{" "}
                <Link to={profileRoutes.profileEdit} className="font-semibold underline">
                  Редактировать профиль
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border-slate-200">
        <p className="text-sm font-semibold text-slate-900">Условия сервиса</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600">
          <li>Вы подаёте заявку на роль координатора доставки в сервисе «Коопзакупки — Якутия».</li>
          <li>Администратор проверит паспорт, водительское удостоверение и СТС.</li>
          <li>После одобрения вы сможете создавать сборы и вести маршрут выдачи заказов.</li>
          <li>Вы обязуетесь соблюдать правила платформы и достоверность загруженных документов.</li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Подробнее — в разделе{" "}
          <Link to={routes.user.support} className="font-medium text-sky-700 underline">
            Поддержка
          </Link>
          .
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <span className="text-sm leading-snug text-slate-800">
            Я соглашаюсь с условиями использования сервиса и даю согласие на проверку
            загружаемых документов администратором.
          </span>
        </label>

        <div className="mt-4">
          <Button
            type="button"
            fullWidth
            disabled={!canContinue}
            rightIcon={<Check size={16} />}
            onClick={onContinue}
          >
            Перейти к документам
          </Button>
        </div>
      </Card>
    </div>
  )
}

export const isDriverApplyProfileComplete = (
  user: { name?: string; phone?: string; email?: string } | null | undefined,
) => {
  if (!user) return false
  const email = user.email?.trim() ?? ""
  return (
    isValidFullName(user.name ?? "") &&
    Boolean(normalizeRuPhone(user.phone ?? "")) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
}
