import { Link } from "react-router-dom"

import { CircleDot, PackageCheck } from "lucide-react"

const mockOrders = [
  {
    id: "YKT-2405-14",
    title: "Сбор «Якутск — Вилюй»",
    status: "В пути к пункту выдачи",
    statusTone: "text-sky-700 bg-sky-50 border-sky-100",
    date: "Ожидается 18 мая",
  },
  {
    id: "YKT-2404-02",
    title: "Сбор «Нерюнгри — малые стойбища»",
    status: "Выдан",
    statusTone: "text-emerald-700 bg-emerald-50 border-emerald-100",
    date: "Получено 2 мая",
  },
]

export const OrdersPage = () => {
  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Мои сборы
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            История и статус кооперативных заказов по выбранным маршрутам.
          </p>
        </div>

        <Link
          to="/"
          className="shrink-0 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          На главную
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {mockOrders.map((order) => (
          <li
            key={order.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  {order.id}
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {order.title}
                </p>
              </div>

              <PackageCheck className="shrink-0 text-teal-600" size={22} />
            </div>

            <span
              className={`mt-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${order.statusTone}`}
            >
              <CircleDot size={12} className="shrink-0" />
              {order.status}
            </span>

            <p className="mt-2 text-xs text-slate-500">
              {order.date}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-slate-500">
        Данные для демонстрации интерфейса. Подключение к бэкенду — на следующих этапах
        разработки.
      </p>
    </div>
  )
}
