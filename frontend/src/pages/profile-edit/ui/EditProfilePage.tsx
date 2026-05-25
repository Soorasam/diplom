import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { applyApiErrorToForm } from "@/shared/lib/api-form-errors"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import {
  formatRuPhoneInput,
  getRuPhoneValidationMessage,
  isValidFullName,
  normalizeRuPhone,
} from "@/shared/lib/validation"

type EditProfileForm = {
  fullName: string
  phone: string
}

export const EditProfilePage = () => {
  const navigate = useNavigate()
  const profileRoutes = useProfileRoutes()
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<EditProfileForm>()

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.name,
        phone: user.phone ? formatRuPhoneInput(user.phone) : "",
      })
    }
  }, [user, reset])

  const onSubmit = async (values: EditProfileForm) => {
    setFormError(null)
    try {
      await updateProfile({
        fullName: values.fullName.trim(),
        phone: normalizeRuPhone(values.phone.trim()) ?? undefined,
      })
      navigate(profileRoutes.profile)
    } catch (err) {
      applyApiErrorToForm(err, setError, {
        setFormError,
        fallback: "Не удалось сохранить профиль",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Редактирование профиля" backTo={profileRoutes.profile} />

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
              validate: (v) => getRuPhoneValidationMessage(v) ?? true,
            })}
          />
        </label>
        {user?.email ? (
          <p className="text-xs text-slate-500">Email: {user.email} (изменяется через поддержку)</p>
        ) : null}
      </Card>

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

      <Button type="submit" fullWidth loading={isSubmitting}>
        Сохранить
      </Button>
    </form>
  )
}
