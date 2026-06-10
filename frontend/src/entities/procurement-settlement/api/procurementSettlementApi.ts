import { http } from "@/shared/api/client"

export type ProcurementReceipt = {
  id: string
  pickupPointId?: string
  objectKey?: string
  fileName: string
  mimeType: string
  url: string
  createdAt: string
  pickupPoint?: { name: string }
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

  listStopReceipts: (roundId: string, pickupPointId: string) =>
    http.get<ProcurementReceipt[]>(
      `${base(roundId)}/${pickupPointId}/receipts`,
      true,
    ),

  uploadStopReceipt: (roundId: string, pickupPointId: string, file: File) =>
    http.upload<ProcurementReceipt>(
      `${base(roundId)}/${pickupPointId}/receipts`,
      file,
      true,
    ),

  receiptFilePath: (roundId: string, receiptId: string) =>
    `${base(roundId)}/receipts/${receiptId}/file`,

  getSettlement: (roundId: string) =>
    http.get<PurchaseSettlement>(`${base(roundId)}/settlement`, true),

  settle: (roundId: string, actualTotal: number) =>
    http.post<PurchaseSettlement>(`${base(roundId)}/settle`, { actualTotal }, true),
}
