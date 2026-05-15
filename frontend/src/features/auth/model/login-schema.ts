import { z } from "zod"

export const loginSchema = z.object({
  phone: z
    .string()
    .min(10, "Введите корректный номер телефона")
    .max(18, "Слишком длинный номер"),
  role: z.enum(["client", "driver", "admin"]),
})

export type LoginFormValues = z.infer<typeof loginSchema>
