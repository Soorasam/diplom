import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Введите корректный email"),
  role: z.enum(["client", "driver", "employee", "admin"]),
})

export type LoginFormValues = z.infer<typeof loginSchema>
