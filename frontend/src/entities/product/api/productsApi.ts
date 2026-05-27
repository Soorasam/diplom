import type { BackendCategory, BackendProduct } from "@/shared/api/backend-types"
import { http } from "@/shared/api/client"
import type { Product } from "@/shared/api/api-types"
import { mapCategory, mapProduct } from "@/shared/api/mappers"

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

export const productsApi = {
  getCategories: async () => {
    const items = await http.get<BackendCategory[]>("/categories")
    return items.map(mapCategory)
  },

  getList: async (filters?: ProductFilters) => {
    const query = filters?.categoryId ? `?category_id=${filters.categoryId}` : ""
    const items = await http.get<BackendProduct[]>(`/products${query}`)
    return applyFilters(items.map(mapProduct), filters)
  },

  getById: async (id: string) => {
    const item = await http.get<BackendProduct>(`/products/${id}`)
    return mapProduct(item)
  },

  getPopular: async () => {
    const items = await http.get<BackendProduct[]>("/products")
    return items.slice(0, 4).map(mapProduct)
  },
}

export type { Product }
