import type { ReactNode } from "react"
import { Car, Check, CreditCard, Package, PackageOpen, ShoppingCart } from "lucide-react"

import type { ResidentPhaseStep } from "@/shared/lib/resident-procurement-phase"
import { cn } from "@/shared/lib/cn"

type Props = {
  step: ResidentPhaseStep
  className?: string
}

const ICON_SIZE = 14
const STROKE = 2

const IconFrame = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center", className)}>
    {children}
  </span>
)

const PaymentIcon = ({ paid, className }: { paid: boolean; className?: string }) => (
  <IconFrame className={className}>
    <span className="relative inline-flex items-center justify-center">
      <CreditCard size={ICON_SIZE} strokeWidth={STROKE} />
      {paid ? (
        <Check
          size={8}
          strokeWidth={2.75}
          className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
        />
      ) : null}
    </span>
  </IconFrame>
)

const TransitIcon = ({ className }: { className?: string }) => (
  <IconFrame className={className}>
    <Car size={ICON_SIZE} strokeWidth={STROKE} className="scale-[1.38]" />
  </IconFrame>
)

export const ResidentPhaseStepIcon = ({ step, className }: Props) => {
  const paid =
    step.id === "pay" &&
    (step.status === "done" || step.shortLabel === "Оплачено" || step.label === "Оплачено")

  switch (step.id) {
    case "collection":
      return (
        <IconFrame className={className}>
          <PackageOpen size={ICON_SIZE} strokeWidth={STROKE} />
        </IconFrame>
      )
    case "pay":
      return <PaymentIcon paid={paid} className={className} />
    case "procurement":
      return (
        <IconFrame className={className}>
          <ShoppingCart size={ICON_SIZE} strokeWidth={STROKE} />
        </IconFrame>
      )
    case "transit":
      return <TransitIcon className={className} />
    case "delivery":
      return (
        <IconFrame className={className}>
          <Package size={ICON_SIZE} strokeWidth={STROKE} />
        </IconFrame>
      )
    default:
      return (
        <IconFrame className={className}>
          <Package size={ICON_SIZE} strokeWidth={STROKE} />
        </IconFrame>
      )
  }
}
