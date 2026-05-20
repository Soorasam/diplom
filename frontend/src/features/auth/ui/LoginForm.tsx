import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { homeRouteForRole, useAuthStore } from "@/app/model/auth-store"
import { loginSchema, type LoginFormValues } from "@/features/auth/model/login-schema"
import { ApiError } from "@/shared/api/client"
import { Button } from "@/shared/ui/button/Button"
import { Input } from "@/shared/ui/input/Input"
import { useState } from "react"

export const LoginForm = () => {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "demo@coop.local", password: "demo12345" },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null)
    try {
      await login(data.email, data.password)
      const user = useAuthStore.getState().user
      navigate(user ? homeRouteForRole(user.role) : "/")
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Не удалось войти")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Пароль"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      {apiError ? (
        <p className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-100">{apiError}</p>
      ) : null}

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        className="!bg-blue-500 hover:!bg-blue-400"
      >
        Войти
      </Button>

      <p className="text-center text-xs text-slate-400">
        Демо: demo@coop.local / demo12345
      </p>
    </form>
  )
}
