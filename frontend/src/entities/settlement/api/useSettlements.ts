import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { settlementsApi } from "./settlementsApi"

export const useSettlements = () =>
  useQuery({
    queryKey: queryKeys.settlements,
    queryFn: () => settlementsApi.getAll(),
  })

export const usePickupPoints = (settlementId?: string) =>
  useQuery({
    queryKey: queryKeys.pickupPoints(settlementId),
    queryFn: () => settlementsApi.getPickupPoints(settlementId),
  })
