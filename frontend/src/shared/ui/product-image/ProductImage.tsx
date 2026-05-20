import { Package } from "lucide-react"

import { cn } from "@/shared/lib/cn"

type ProductImageVariant = "card" | "detail"

const frameClass: Record<ProductImageVariant, string> = {
  /** Сетка каталога 2 колонки */
  card: "aspect-square w-full p-4",
  /** Страница товара — широкий блок, не на весь экран */
  detail: "aspect-[4/3] w-full p-6 sm:aspect-[3/2] sm:p-8",
}

interface ProductImageProps {
  src?: string
  alt?: string
  variant?: ProductImageVariant
  className?: string
}

export const ProductImage = ({
  src,
  alt = "",
  variant = "card",
  className,
}: ProductImageProps) => (
  <div
    className={cn(
      "flex items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50",
      frameClass[variant],
      className,
    )}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain drop-shadow-sm"
        loading="lazy"
        decoding="async"
      />
    ) : (
      <Package
        className="text-slate-300"
        size={variant === "detail" ? 56 : 40}
        strokeWidth={1.25}
      />
    )}
  </div>
)
