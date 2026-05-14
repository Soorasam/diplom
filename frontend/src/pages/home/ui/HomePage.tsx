import { Link } from "react-router-dom"

import { ArrowRight, MapPin, Package, Snowflake, Users } from "lucide-react"

export const HomePage = () => {
  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-900 px-5 py-6 text-white shadow-lg shadow-teal-900/20">
        <p className="text-xs font-medium uppercase tracking-wider text-teal-200/90">
          Кооперативные закупки
        </p>

        <h1 className="mt-2 text-2xl font-bold leading-tight">
          Доставка товаров в отдалённые районы Якутии
        </h1>

        <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-teal-100/95">
          Объединяем заказы жителей посёлков и сёл: чем больше участников сбора, тем выгоднее
          логистика и цена для каждого.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Snowflake size={14} className="shrink-0" />
            Сезонные маршруты
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <MapPin size={14} className="shrink-0" />
            Пункты выдачи
          </span>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2">
        {[
          { value: "12", label: "активных сборов", icon: Package },
          { value: "48", label: "населённых пунктов", icon: MapPin },
          { value: "1.2k", label: "участников", icon: Users },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center rounded-xl border border-teal-100 bg-white/80 px-2 py-3 text-center shadow-sm"
          >
            <item.icon className="mb-1 text-teal-600" size={18} />

            <span className="text-lg font-bold tabular-nums text-slate-800">
              {item.value}
            </span>

            <span className="text-[10px] font-medium leading-tight text-slate-500">
              {item.label}
            </span>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          Как это работает
        </h2>

        <ol className="mt-3 space-y-2.5 text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
              1
            </span>

            <span>
              Выбираете товары в каталоге — они попадают в общий сбор по вашему маршруту.
            </span>
          </li>

          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
              2
            </span>

            <span>
              Дожидаетесь закрытия сбора и подтверждения доставки (зимник, река, автодорога — в зависимости от сезона).
            </span>
          </li>

          <li className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
              3
            </span>

            <span>
              Получаете заказ в пункте выдачи или у доверенного координатора в населённом пункте.
            </span>
          </li>
        </ol>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          to="/catalog"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-teal-700/25 transition hover:bg-teal-700"
        >
          Перейти в каталог
          <ArrowRight size={18} />
        </Link>

        <Link
          to="/orders"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-teal-200 bg-white px-4 py-3.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
        >
          Мои сборы
        </Link>
      </div>
    </div>
  )
}
