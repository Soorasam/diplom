import type { BackendCategory, BackendProduct } from "@/shared/api/backend-types"

type CatalogPayload = {
  categories: BackendCategory[]
  products: BackendProduct[]
}

let cache: CatalogPayload | null = null

export async function loadStaticCatalog(): Promise<CatalogPayload> {
  if (cache) return cache
  const res = await fetch(`${import.meta.env.BASE_URL}catalog/data.json`)
  if (!res.ok) {
    throw new Error("Не удалось загрузить каталог")
  }
  cache = (await res.json()) as CatalogPayload
  return cache
}
