import { Link } from "react-router-dom"

import { Home, MapPinOff } from "lucide-react"

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
        <MapPinOff size={32} />
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Ошибка 404
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Такой страницы нет
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
          Возможно, ссылка устарела или маршрут изменился — как на зимнике после оттепели.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700"
      >
        <Home size={18} />
        На главную
      </Link>
    </div>
  )
}
