import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { routes } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { formatRuPhoneInput, isValidFullName, normalizeRuPhone } from "@/shared/lib/validation"

type EditProfileForm = {
  fullName: string
  phone: string
}

export const EditProfilePage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<EditProfileForm>()

  useEffect(() => {
    if (user) {
      reset({ fullName: user.name, phone: user.phone })
    }
  }, [user, reset])

  const onSubmit = async (values: EditProfileForm) => {
    await updateProfile({
      fullName: values.fullName.trim(),
      phone: normalizeRuPhone(values.phone.trim()) ?? undefined,
    })
    navigate(routes.profile)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Редактирование профиля" backTo={routes.profile} />

      <Card className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-700">
          ФИО
          <Input
            className="mt-1"
            error={errors.fullName?.message}
            {...register("fullName", {
              required: "Укажите ФИО",
              validate: (v) =>
                isValidFullName(v) ||
                "ФИО: 2-3 слова, каждое с заглавной буквы (например, Иванов Иван Иванович)",
            })}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Телефон
          <Input
            className="mt-1"
            type="tel"
            placeholder="+7 (999) 000-00-00"
            error={errors.phone?.message}
            {...register("phone", {
              onChange: (e) => {
                e.target.value = formatRuPhoneInput(e.target.value)
              },
              validate: (v) =>
                !v || normalizeRuPhone(v) !== null || "Введите номер в формате +7",
            })}
          />
        </label>
        {user?.email ? (
          <p className="text-xs text-slate-500">Email: {user.email} (изменяется через поддержку)</p>
        ) : null}
      </Card>

      <Button type="submit" fullWidth loading={isSubmitting}>
        Сохранить
      </Button>
    </form>
  )
}
