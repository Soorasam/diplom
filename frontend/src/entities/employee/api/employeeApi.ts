import { http } from "@/shared/api/client"
import { mapBackendOrderStatus } from "@/shared/api/mappers"
import type { Order } from "@/shared/api/api-types"
export interface EmployeeOrderView extends Order {
  publicNumber?: string
  userName: string
  userPhone: string
  itemsText: string
  roundTitle?: string | null
}

export type DeliveryStopStatus = "pending" | "in_progress" | "completed"

export interface EmployeeWorkspaceOrder {
  id: string
  publicNumber?: string
  status: string
  totalAmount: number
  roundId: string | null
  roundTitle: string | null
  customerName: string | null
  customerPhone: string | null
  driverName?: string | null
  driverPhone?: string | null
  items: { name: string; quantity: number; unit: string }[]
  canReceive?: boolean
}

export interface EmployeeIntakeGroup {
  roundId: string
  roundTitle: string
  stopStatus: DeliveryStopStatus
  progress: { total: number; received: number; pending: number }
  orders: EmployeeWorkspaceOrder[]
}

export interface EmployeeWorkspace {
  pickupPoint: {
    id: string
    name: string
    address: string
    settlementName: string
  }
  intakeGroups: EmployeeIntakeGroup[]
  handoutOrders: EmployeeWorkspaceOrder[]
  stats: {
    awaitingDriver: number
    awaitingDispatch: number
    readyForHandout: number
    openRoundOrders: number
    activeRounds: number
  }
  hints: string[]
}

function mapWorkspaceOrder(o: EmployeeWorkspaceOrder): EmployeeOrderView {
  const itemsText = o.items.map((i) => `${i.name} × ${i.quantity} ${i.unit}`).join(", ")
  return {
    id: o.id,
    publicNumber: o.publicNumber,
    userId: "",
    procurementId: o.roundId ?? "",
    status: mapBackendOrderStatus(o.status),
    total: o.totalAmount,
    pickupPointId: "",
    createdAt: "",
    timeline: [],
    items: o.items.map((i, idx) => ({
      productId: String(idx),
      productName: i.name,
      quantity: i.quantity,
      price: 0,
    })),
    userName: o.customerName ?? "Житель",
    userPhone: o.customerPhone ?? "—",
    itemsText,
    roundTitle: o.roundTitle,
  }
}

export const employeeApi = {
  getWorkspace: () => http.get<EmployeeWorkspace>("/employee/workspace", true),

  receiveFromDriver: (orderId: string) =>
    http.post<{
      order: EmployeeWorkspaceOrder
      stopStatus: DeliveryStopStatus
      stopCompleted: boolean
      roundDeliveryCompleted: boolean
    }>(`/employee/orders/${orderId}/receive`, {}, true),

  handoutToResident: (orderId: string) =>
    http.post<{ order: EmployeeWorkspaceOrder }>(
      `/employee/orders/${orderId}/handout`,
      {},
      true,
    ),

  getPickupPointIdByEmployee: (_userId: string, pickupPointId?: string | null) =>
    Promise.resolve(pickupPointId ?? null),

  getOrdersByPickupPoint: async (_pickupPointId: string) => {
    const workspace = await employeeApi.getWorkspace()
    const handout = workspace.handoutOrders.map(mapWorkspaceOrder)
    const intake = workspace.intakeGroups.flatMap((g) =>
      g.orders.map(mapWorkspaceOrder),
    )
    return [...intake, ...handout]
  },

  mapWorkspaceOrder,
}
