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
    <div className="auth-page flex flex-col px-4 py-8 font-sans text-white safe-top">
      <div className="mx-auto flex w-full max-w-sm flex-col py-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <Snowflake size={28} className="text-sky-300" />
          </div>
          <h1 className="text-2xl font-bold leading-normal tracking-tight">
            {mode === "login" ? "Вход в сервис" : "Регистрация"}
          </h1>
          <p className="mt-3 text-sm font-normal leading-relaxed text-slate-300">
            {mode === "login"
              ? "Войдите в аккаунт для заказов и участия в сборах."
              : "Создайте аккаунт жителя — укажите населённый пункт и контакты."}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-slate-600 bg-slate-800/80 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "min-h-11 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              mode === "login"
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={cn(
              "min-h-11 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              mode === "register"
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            Регистрация
          </button>
        </div>

        <div className="rounded-2xl border border-slate-600 bg-slate-800/60 p-4">
          {mode === "login" ? <LoginForm /> : <RegisterForm />}
        </div>

        <Link
          to={routes.user.root}
          className="mt-8 block text-center text-sm font-medium text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}
