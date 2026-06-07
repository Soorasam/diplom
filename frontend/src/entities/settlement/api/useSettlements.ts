import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { settlementsApi } from "./settlementsApi"

export const useSettlements = () =>
  useQuery({
    queryKey: queryKeys.settlements,
    queryFn: () => settlementsApi.getAll(),
  })
