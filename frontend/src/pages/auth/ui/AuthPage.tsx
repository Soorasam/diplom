import { useState } from "react"
import { Link } from "react-router-dom"
import { Snowflake } from "lucide-react"

import { LoginForm } from "@/features/auth/ui/LoginForm"
import { RegisterForm } from "@/features/auth/ui/RegisterForm"
import { routes } from "@/shared/config/routes"
import { cn } from "@/shared/lib/cn"

type AuthMode = "login" | "register"

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login")

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Snowflake size={28} className="text-blue-200" />
          </div>
          <h1 className="text-2xl font-bold leading-tight">
            {mode === "login" ? "Вход в сервис" : "Регистрация"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {mode === "login"
              ? "Войдите в аккаунт для заказов и участия в сборах."
              : "Создайте аккаунт жителя — укажите населённый пункт и контакты."}
          </p>
        </div>

        <div className="mb-4 flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition",
              mode === "login"
                ? "bg-white/15 text-white"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition",
              mode === "register"
                ? "bg-white/15 text-white"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            Регистрация
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          {mode === "login" ? <LoginForm /> : <RegisterForm />}
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
