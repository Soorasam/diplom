import { apiCall } from "@/shared/api/client"
import {
  categories,
  products,
  type Product,
} from "@/shared/api/mock-db"

export interface ProductFilters {
  categoryId?: string
  search?: string
  sort?: "price_asc" | "price_desc" | "name"
}

export const productsApi = {
  getCategories: () => apiCall(() => categories),

  getList: (filters?: ProductFilters) =>
    apiCall(() => {
      let list = [...products]
      if (filters?.categoryId) {
        list = list.filter((p) => p.categoryId === filters.categoryId)
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        list = list.filter((p) => p.name.toLowerCase().includes(q))
      }
      if (filters?.sort === "price_asc") list.sort((a, b) => a.price - b.price)
      if (filters?.sort === "price_desc") list.sort((a, b) => b.price - a.price)
      if (filters?.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name))
      return list
    }),

  getById: (id: string) =>
    apiCall(() => {
      const item = products.find((p) => p.id === id)
      if (!item) throw new Error("Товар не найден")
      return item
    }),

  getPopular: () => apiCall(() => products.filter((p) => p.popular)),
}

export type { Product }
