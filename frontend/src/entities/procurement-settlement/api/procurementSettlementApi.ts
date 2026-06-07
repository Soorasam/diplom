import { http } from "@/shared/api/client"

export type ProcurementReceipt = {
  id: string
  fileName: string
  mimeType: string
  url: string
  createdAt: string
}

export type PurchaseSettlementOrder = {
  id: string
  publicNumber: string
  totalEstimate: number
  refundAmount: number
  netHeld: number
}

export type PurchaseSettlement = {
  roundId: string
  receiptCount: number
  reservedTotal: number
  refundTotal: number
  netTotal: number
  actualPurchaseTotal: number | null
  purchaseSettledAt: string | null
  orders: PurchaseSettlementOrder[]
}

const base = (roundId: string) => `/driver/rounds/${roundId}/procurement`

export const procurementSettlementApi = {
  listReceipts: (roundId: string) =>
    http.get<ProcurementReceipt[]>(`${base(roundId)}/receipts`, true),

  uploadReceipt: (roundId: string, file: File) =>
    http.upload<ProcurementReceipt>(`${base(roundId)}/receipts`, file, true),

  getSettlement: (roundId: string) =>
    http.get<PurchaseSettlement>(`${base(roundId)}/settlement`, true),

  settle: (roundId: string, actualTotal: number) =>
    http.post<PurchaseSettlement>(`${base(roundId)}/settle`, { actualTotal }, true),
}
