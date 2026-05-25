import { z } from "zod"
import { getRuPhoneValidationMessage, isValidFullName } from "@/shared/lib/validation"

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Минимум 2 символа")
      .max(255)
      .refine(
        (v) => isValidFullName(v),
        "ФИО: 2-3 слова, каждое с заглавной буквы (например, Иванов Иван Иванович)",
      ),
    email: z.string().trim().email("Введите корректный e-mail"),
    phone: z
      .string()
      .trim()
      .optional()
      .superRefine((v, ctx) => {
        const msg = getRuPhoneValidationMessage(v ?? "")
        if (msg) {
          ctx.addIssue({ code: "custom", message: msg })
        }
      }),
    password: z.string().min(8, "Минимум 8 символов").max(128),
    confirmPassword: z.string(),
    settlementId: z.string().uuid("Выберите населённый пункт"),
    pickupPointId: z
      .string()
      .optional()
      .refine((v) => !v || z.string().uuid().safeParse(v).success, "Некорректный пункт выдачи"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>
