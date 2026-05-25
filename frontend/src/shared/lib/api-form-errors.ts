import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

import { ApiError } from "@/shared/api/client"

const PHONE_MARKERS = ["телефон", "phone", "номер"]
const EMAIL_MARKERS = ["email", "e-mail", "почт"]

const matchesAny = (text: string, markers: string[]) => {
  const lower = text.toLowerCase()
  return markers.some((marker) => lower.includes(marker))
}

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export const applyApiErrorToForm = <T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  options?: {
    setFormError?: (message: string | null) => void
    fallback?: string
  },
): void => {
  const { setFormError, fallback = "Не удалось сохранить" } = options ?? {}

  if (!(err instanceof ApiError)) {
    setFormError?.(getApiErrorMessage(err, fallback))
    return
  }

  const msg = err.message

  if (err.status === 409 || err.status === 400) {
    if (matchesAny(msg, PHONE_MARKERS) || msg.toLowerCase().includes("полный номер")) {
      setError("phone" as Path<T>, {
        type: "server",
        message: msg,
      })
      setFormError?.(null)
      return
    }

    if (matchesAny(msg, EMAIL_MARKERS)) {
      setError("email" as Path<T>, {
        type: "server",
        message: msg,
      })
      setFormError?.(null)
      return
    }
  }

  setFormError?.(msg || fallback)
}
