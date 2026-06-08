import { http } from "@/shared/api/client"

export type ProcurementOutcome = "purchased" | "defer_next" | "unavailable"

export type ProcurementChecklistLine = {
  orderItemId: string
  orderId: string
  orderNumber: string
  deliverySettlementName: string
  productId: string
  productName: string
  quantity: number
  unit: string
  lineTotal: number
}

export type ProcurementChecklist = {
  active: true
  roundId: string
  pickupPointId: string
  locationName: string
  address: string
  hasNextProcurementPoint: boolean
  nextProcurementName: string | null
  procurementCompleted: boolean
  items: ProcurementChecklistLine[]
}

export type ProcurementChecklistInactive = { active: false }

export const procurementChecklistApi = {
  getActive: (roundId: string) =>
    http.get<ProcurementChecklist | ProcurementChecklistInactive>(
      `/driver/rounds/${roundId}/procurement/active`,
      true,
    ),

  submit: (
    roundId: string,
    pickupPointId: string,
    items: { orderItemId: string; outcome: ProcurementOutcome }[],
  ) =>
    http.post<{ ok: boolean; canDepart: boolean; refundsCount: number }>(
      `/driver/rounds/${roundId}/procurement/${pickupPointId}`,
      { items },
      true,
    ),

  depart: (roundId: string, pickupPointId: string) =>
    http.post<{
      ok: boolean
      ordersSentToTransit: number
      procurementStopsRemaining: number
    }>(
      `/driver/rounds/${roundId}/procurement/${pickupPointId}/depart`,
      {},
      true,
    ),
}
