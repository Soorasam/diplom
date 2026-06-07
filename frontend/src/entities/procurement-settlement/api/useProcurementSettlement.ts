import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { procurementSettlementApi } from "./procurementSettlementApi"

export const procurementSettlementKeys = {
  settlement: (roundId: string) => ["procurement-settlement", roundId] as const,
  receipts: (roundId: string) => ["procurement-receipts", roundId] as const,
}

export const usePurchaseSettlement = (roundId?: string) =>
  useQuery({
    queryKey: procurementSettlementKeys.settlement(roundId ?? ""),
    queryFn: () => procurementSettlementApi.getSettlement(roundId!),
    enabled: Boolean(roundId),
  })

export const useProcurementReceipts = (roundId?: string) =>
  useQuery({
    queryKey: procurementSettlementKeys.receipts(roundId ?? ""),
    queryFn: () => procurementSettlementApi.listReceipts(roundId!),
    enabled: Boolean(roundId),
  })

export const useUploadProcurementReceipt = (roundId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => procurementSettlementApi.uploadReceipt(roundId, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: procurementSettlementKeys.receipts(roundId) })
      void qc.invalidateQueries({ queryKey: procurementSettlementKeys.settlement(roundId) })
    },
  })
}

export const useSettlePurchase = (roundId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (actualTotal: number) =>
      procurementSettlementApi.settle(roundId, actualTotal),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: procurementSettlementKeys.settlement(roundId) })
      void qc.invalidateQueries({ queryKey: procurementSettlementKeys.receipts(roundId) })
      void qc.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}
