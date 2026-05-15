import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { productsApi, type ProductFilters } from "./productsApi"

export const useProducts = (filters?: ProductFilters) =>
  useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => productsApi.getList(filters),
  })

export const useProduct = (id: string) =>
  useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: Boolean(id),
  })

export const usePopularProducts = () =>
  useQuery({
    queryKey: [...queryKeys.products.all, "popular"],
    queryFn: () => productsApi.getPopular(),
  })

export const useCategories = () =>
  useQuery({
    queryKey: [...queryKeys.products.all, "categories"],
    queryFn: () => productsApi.getCategories(),
  })
