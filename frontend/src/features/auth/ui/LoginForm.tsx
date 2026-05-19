import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { loginSchema, type LoginFormValues } from "@/features/auth/model/login-schema"
import { routes } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button/Button"
import { Input } from "@/shared/ui/input/Input"
import type { UserRole } from "@/shared/types"

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "client", label: "Житель" },
  { value: "driver", label: "Водитель" },
  { value: "admin", label: "Администратор" },
]

export const LoginForm = () => {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", role: "client" },
  })

  const role = watch("role")

  const onSubmit = async (data: LoginFormValues) => {
    await login(data.phone, data.role)
    if (data.role === "driver") navigate(routes.driver.root)
    else if (data.role === "admin") navigate(routes.admin.root)
    else navigate(routes.home)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Телефон"
        type="tel"
        placeholder="+7 (914) 123-45-67"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <fieldset>
        <legend className="mb-2 block text-xs font-medium text-slate-300">
          Роль
        </legend>

        <div className="grid grid-cols-3 gap-2">
          {roleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue("role", opt.value)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                role === opt.value
                  ? "border-blue-400 bg-blue-500/20 text-white"
                  : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Button type="submit" fullWidth loading={isSubmitting} className="!bg-blue-500 hover:!bg-blue-400">
        Войти
      </Button>
    </form>
  )
}
