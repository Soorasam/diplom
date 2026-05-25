import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { homeRouteForRole, useAuthStore } from "@/app/model/auth-store"
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/model/register-schema"
import { usePickupPoints, useSettlements } from "@/entities/settlement/api/useSettlements"
import { applyApiErrorToForm } from "@/shared/lib/api-form-errors"
import { routes } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button/Button"
import { Input } from "@/shared/ui/input/Input"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { cn } from "@/shared/lib/cn"
import { formatRuPhoneInput, normalizeRuPhone } from "@/shared/lib/validation"

export const RegisterForm = () => {
  const navigate = useNavigate()
  const registerUser = useAuthStore((s) => s.register)
  const [apiError, setApiError] = useState<string | null>(null)

  const { data: settlements, isLoading: settlementsLoading } = useSettlements()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      settlementId: "",
      pickupPointId: "",
    },
  })

  const settlementId = useWatch({ control, name: "settlementId" })
  const { data: pickupPoints, isLoading: pickupLoading } = usePickupPoints(
    settlementId || undefined,
  )

  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null)
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: normalizeRuPhone(data.phone ?? "") ?? undefined,
        settlementId: data.settlementId,
        pickupPointId: data.pickupPointId || undefined,
      })
      const user = useAuthStore.getState().user
      navigate(user ? homeRouteForRole(user.role) : routes.user.root)
    } catch (err) {
      applyApiErrorToForm(err, setError, {
        setFormError: setApiError,
        fallback: "Не удалось зарегистрироваться",
      })
    }
  }

  const selectClass = cn(
    "w-full min-h-11 rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900",
    "outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    "border-slate-200",
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="ФИО"
        placeholder="Иванов Иван"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <Input
        label="E-mail"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Телефон"
        type="tel"
        placeholder="+7 (999) 000-00-00"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone", {
          onChange: (e) => {
            e.target.value = formatRuPhoneInput(e.target.value)
          },
        })}
      />

      <Input
        label="Пароль"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        label="Повтор пароля"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <label className="block w-full">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">
          Населённый пункт
        </span>
        {settlementsLoading ? (
          <div className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Spinner className="h-5 w-5" />
          </div>
        ) : (
          <select
            className={cn(selectClass, errors.settlementId && "border-red-400")}
            {...register("settlementId")}
          >
            <option value="">Выберите пункт</option>
            {settlements?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.ulus ? ` · ${s.ulus} улус` : ""}
              </option>
            ))}
          </select>
        )}
        {errors.settlementId ? (
          <span className="mt-1 block text-xs text-red-600">{errors.settlementId.message}</span>
        ) : null}
      </label>

      {settlementId ? (
        <label className="block w-full">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">
            Пункт выдачи <span className="text-slate-400">(необязательно)</span>
          </span>
          {pickupLoading ? (
            <div className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white">
              <Spinner className="h-5 w-5" />
            </div>
          ) : (
            <select className={selectClass} {...register("pickupPointId")}>
              <option value="">Не выбран</option>
              {pickupPoints?.map((pp) => (
                <option key={pp.id} value={pp.id}>
                  {pp.name}
                </option>
              ))}
            </select>
          )}
        </label>
      ) : null}

      {apiError ? (
        <p className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-100">{apiError}</p>
      ) : null}

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        className="bg-blue-500! hover:bg-blue-400!"
      >
        Зарегистрироваться
      </Button>
    </form>
  )
}
