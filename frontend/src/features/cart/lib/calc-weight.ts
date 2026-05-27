import type { Product } from "@/shared/api/api-types"

export const calcLineWeightKg = (
  product: Pick<Product, "weightKg" | "unit">,
  quantity: number,
): number => {
  const w = product.weightKg > 0 ? product.weightKg : 1
  if (product.unit === "кг" || product.unit === "kg") return w * quantity
  return w * quantity
}

export const calcCartWeightKg = (
  items: { productId: string; quantity: number }[],
  products: Product[],
): number =>
  items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)
    if (!product) return sum
    return sum + calcLineWeightKg(product, item.quantity)
  }, 0)
