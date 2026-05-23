import { Link } from "react-router-dom"

import { Home, MapPinOff } from "lucide-react"

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4 text-center font-sans safe-top dark:bg-[#0F141C]">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-sky-50 text-sky-700 dark:border-slate-800 dark:bg-sky-950/50 dark:text-sky-400">
        <MapPinOff size={32} />
      </div>

      <div>
        <p className="text-sm font-semibold uppercase leading-normal tracking-wide text-slate-500 dark:text-slate-400">
          Ошибка 404
        </p>

        <h1 className="mt-2 text-2xl font-bold leading-normal text-slate-900 dark:text-slate-100">
          Такой страницы нет
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
          Возможно, ссылка устарела или маршрут изменился — как на зимнике после оттепели.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400"
      >
        <Home size={18} />
        На главную
      </Link>
    </div>
  )
}
