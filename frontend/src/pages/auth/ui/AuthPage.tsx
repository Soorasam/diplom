import { Link } from "react-router-dom"
import { Snowflake } from "lucide-react"

import { LoginForm } from "@/features/auth/ui/LoginForm"
import { routes } from "@/shared/config/routes"

export const AuthPage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Snowflake size={28} className="text-blue-200" />
          </div>
          <h1 className="text-2xl font-bold leading-tight">Вход в сервис</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Вход через API бэкенда. Убедитесь, что сервер запущен на порту 3000.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <LoginForm />
        </div>

        <Link
          to={routes.home}
          className="mt-8 block text-center text-sm font-medium text-blue-200 underline-offset-4 hover:text-white hover:underline"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}
