import { z } from "zod"

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Минимум 2 символа").max(255),
    email: z.string().trim().email("Введите корректный e-mail"),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || v.length >= 10, "Минимум 10 цифр"),
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
