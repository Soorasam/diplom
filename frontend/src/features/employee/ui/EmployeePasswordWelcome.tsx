import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { useAuthStore } from "@/app/model/auth-store"
import { Button } from "@/shared/ui/button/Button"
import { Input } from "@/shared/ui/input/Input"

const schema = z
  .object({
    newPassword: z.string().min(8, "Минимум 8 символов").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>

export const EmployeePasswordWelcome = () => {
  const user = useAuthStore((s) => s.user)
  const setPassword = useAuthStore((s) => s.setPassword)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  if (!user?.mustChangePassword) return null

  const onSubmit = async (data: FormValues) => {
    setError(null)
    setLoading(true)
    try {
      await setPassword({ newPassword: data.newPassword })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить пароль")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-welcome-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#18202C]">
        <h2
          id="employee-welcome-title"
          className="text-lg font-bold text-slate-900 dark:text-slate-100"
        >
          Добро пожаловать!
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Вы вошли по временному паролю от администратора. Задайте{" "}
          <strong>свой постоянный пароль</strong> — без этого интерфейс ПВЗ недоступен.
        </p>
        {user.email ? (
          <p className="mt-1 text-xs text-slate-500">{user.email}</p>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-3">
          <Input
            label="Новый пароль"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <Input
            label="Повторите пароль"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Сохранение…" : "Сохранить и продолжить"}
          </Button>
        </form>
      </div>
    </div>
  )
}
