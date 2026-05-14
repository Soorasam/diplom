import { Link } from "react-router-dom"

import { ChevronRight, ClipboardList, LogOut, Phone, UserCircle } from "lucide-react"

const rows = [
  { label: "Населённый пункт по умолчанию", value: "с. Хандыга" },
  { label: "Улус / район", value: "Томпонский улус" },
  { label: "Телефон для связи", value: "+7 (41167) 00-00" },
]

export const ProfilePage = () => {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center gap-4 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-800">
          <UserCircle size={32} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-slate-900">
            Участник сбора
          </p>

          <p className="truncate text-sm text-slate-600">
            Роль: житель / координатор пункта (макет)
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
              i > 0 ? "border-t border-slate-100" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                {row.label}
              </p>

              <p className="mt-0.5 text-sm font-medium text-slate-900">
                {row.value}
              </p>
            </div>

            <Phone className="shrink-0 text-slate-300" size={18} />
          </div>
        ))}
      </section>

      <Link
        to="/orders"
        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/50"
      >
        <span className="flex items-center gap-2">
          <ClipboardList size={20} className="text-teal-600" />
          Мои сборы и уведомления
        </span>

        <ChevronRight className="text-slate-400" size={20} />
      </Link>

      <Link
        to="/auth"
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <LogOut size={18} />
        Выйти (макет)
      </Link>

      <p className="text-center text-xs leading-relaxed text-slate-500">
        Профиль используется для маршрутизации заказов и связи при задержках доставки в
        труднодоступные районы.
      </p>
    </div>
  )
}
