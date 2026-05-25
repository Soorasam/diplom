import type { BackendCategory, BackendProduct } from "@/shared/api/backend-types"
import { http } from "@/shared/api/client"
import type { Product } from "@/shared/api/mock-db"
import { mapCategory, mapProduct } from "@/shared/api/mappers"

import { loadStaticCatalog } from "./staticCatalog"

const useStaticCatalog = import.meta.env.VITE_STATIC_CATALOG === "true"

export interface ProductFilters {
  categoryId?: string
  search?: string
  sort?: "price_asc" | "price_desc" | "name"
}

function applyFilters(list: Product[], filters?: ProductFilters): Product[] {
  let result = [...list]
  if (filters?.categoryId) {
    result = result.filter((p) => p.categoryId === filters.categoryId)
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    result = result.filter((p) => p.name.toLowerCase().includes(q))
  }
  if (filters?.sort === "price_asc") result.sort((a, b) => a.price - b.price)
  if (filters?.sort === "price_desc") result.sort((a, b) => b.price - a.price)
  if (filters?.sort === "name") result.sort((a, b) => a.name.localeCompare(b.name))
  return result
}

async function getCatalog(): Promise<{
  categories: BackendCategory[]
  products: BackendProduct[]
}> {
  if (useStaticCatalog) {
    return loadStaticCatalog()
  }
  const [categories, products] = await Promise.all([
    http.get<BackendCategory[]>("/categories"),
    http.get<BackendProduct[]>("/products"),
  ])
  return { categories, products }
}

export const productsApi = {
  getCategories: async () => {
    const { categories } = await getCatalog()
    return categories.map(mapCategory)
  },

  getList: async (filters?: ProductFilters) => {
    const { products } = await getCatalog()
    let list = products.map(mapProduct)
    if (filters?.categoryId) {
      list = list.filter((p) => p.categoryId === filters.categoryId)
    }
    return applyFilters(list, filters)
  },

  getById: async (id: string) => {
    const { products } = await getCatalog()
    const item = products.find((p) => p.id === id)
    if (!item) throw new Error("Товар не найден")
    return mapProduct(item)
  },

  getPopular: async () => {
    const { products } = await getCatalog()
    return products.slice(0, 4).map(mapProduct)
  },
}

export type { Product }
