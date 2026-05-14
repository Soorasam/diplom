import { Link } from "react-router-dom"

import { ChevronRight, Milk, Pill, Shirt, Wrench } from "lucide-react"

const categories = [
  {
    title: "Продукты и напитки",
    hint: "Длительный срок хранения, бакалея",
    icon: Milk,
    tone: "from-amber-50 to-orange-50 border-amber-100",
    iconClass: "text-amber-700",
  },
  {
    title: "Бытовая химия и гигиена",
    hint: "Средства, подгузники, расходники",
    icon: Shirt,
    tone: "from-sky-50 to-cyan-50 border-sky-100",
    iconClass: "text-sky-700",
  },
  {
    title: "Медикаменты и аптечка",
    hint: "По рецепту и без — уточняется отдельно",
    icon: Pill,
    tone: "from-emerald-50 to-teal-50 border-emerald-100",
    iconClass: "text-emerald-700",
  },
  {
    title: "Стройматериалы и хозтовары",
    hint: "Мелкий груз, совместная доставка",
    icon: Wrench,
    tone: "from-slate-100 to-zinc-100 border-slate-200",
    iconClass: "text-slate-700",
  },
]

const mockRounds = [
  {
    id: "1",
    route: "Якутск → Верхневилюйский улус",
    closes: "до 22 мая",
    progress: 73,
  },
  {
    id: "2",
    route: "Нерюнгри → отдалённые стойбища",
    closes: "до 28 мая",
    progress: 41,
  },
]

export const CatalogPage = () => {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Каталог
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Товары привязаны к маршрутам доставки. Сначала выберите категорию — затем товар и
          населённый пункт в корзине.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Категории
        </h2>

        <ul className="flex flex-col gap-2">
          {categories.map((cat, index) => (
            <li key={cat.title}>
              <Link
                to={`/product/${index + 1}`}
                className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-r p-4 shadow-sm transition hover:shadow-md ${cat.tone}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 shadow-sm ${cat.iconClass}`}
                >
                  <cat.icon size={24} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {cat.title}
                  </p>

                  <p className="text-xs text-slate-600">
                    {cat.hint}
                  </p>
                </div>

                <ChevronRight className="shrink-0 text-slate-400" size={20} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          Активные сборы
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Пример: когда набор заказов по маршруту закрывается, формируется общая отгрузка.
        </p>

        <ul className="mt-3 space-y-3">
          {mockRounds.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
            >
              <p className="text-sm font-medium text-slate-900">
                {r.route}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Заказ {r.closes}
              </p>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${r.progress}%` }}
                />
              </div>

              <p className="mt-1 text-[11px] text-slate-500">
                Заполнено {r.progress}% от минимального объёма маршрута
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
