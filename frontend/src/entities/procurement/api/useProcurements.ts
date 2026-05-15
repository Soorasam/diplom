import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { procurementsApi } from "./procurementsApi"

export const useActiveProcurements = () =>
  useQuery({
    queryKey: queryKeys.procurements.active,
    queryFn: () => procurementsApi.getActive(),
  })

export const useProcurement = (id: string) =>
  useQuery({
    queryKey: [...queryKeys.procurements.all, id],
    queryFn: () => procurementsApi.getById(id),
    enabled: Boolean(id),
  })
