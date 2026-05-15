import { z } from "zod"

export const checkoutSchema = z.object({
  agreeTerms: z.boolean().refine((v) => v === true, {
    message: "Подтвердите согласие с условиями доставки",
  }),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
