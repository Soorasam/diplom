import { Link } from "react-router-dom"

import { Snowflake } from "lucide-react"

export const AuthPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-teal-950 via-teal-900 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-sm flex-1 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Snowflake size={28} className="text-teal-200" />
          </div>

          <h1 className="text-2xl font-bold leading-tight">
            Вход для жителей и координаторов
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-teal-100/90">
            Сервис кооперативных закупок для отдалённых населённых пунктов Республики Саха
            (Якутия). Авторизация — заглушка для макета интерфейса.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <label className="block text-xs font-medium text-teal-100/90">
            Телефон или e-mail
          </label>

          <input
            type="text"
            readOnly
            placeholder="+7 …"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-teal-200/40"
          />

          <label className="mt-4 block text-xs font-medium text-teal-100/90">
            Пароль
          </label>

          <input
            type="password"
            readOnly
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-teal-200/40"
          />

          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-teal-400 py-3 text-sm font-semibold text-teal-950 transition hover:bg-teal-300"
          >
            Войти
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-teal-200/70">
          Новый участник сможет присоединиться к сбору после подтверждения контактов и
          населённого пункта.
        </p>

        <Link
          to="/"
          className="mt-8 block text-center text-sm font-medium text-teal-200 underline-offset-4 hover:text-white hover:underline"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}
