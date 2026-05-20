import type {
  DeliveryMode,
  DriverApplicationStatus,
  OrderStatus,
  ProcurementStatus,
  UserRole,
} from "@/shared/types"

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  role: UserRole
  settlementId: string
  pickupPointId?: string
  avatarUrl?: string
}

export interface DriverApplicationDocument {
  id: string
  type: string
  url: string
  fileName?: string | null
  mimeType?: string | null
}

export interface DriverApplication {
  id: string
  userId: string
  status: DriverApplicationStatus
  submittedAt: string
  reviewedAt?: string
  rejectionReason?: string
  vehicleSummary?: string
  documents?: DriverApplicationDocument[]
}

export interface PvzEmployeeProfile {
  userId: string
  pickupPointId: string
}

export interface Settlement {
  id: string
  name: string
  ulus: string
  population: number
  coordinates: { lat: number; lng: number }
}

export interface PickupPoint {
  id: string
  settlementId: string
  name: string
  address: string
  coordinatorName: string
  coordinatorPhone: string
  coordinates: { lat: number; lng: number }
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  imageUrl: string
  weightKg: number
  unit: string
  popular?: boolean
}

export interface Procurement {
  id: string
  title: string
  routeId: string
  status: ProcurementStatus
  closesAt: string
  minVolumePercent: number
  currentVolumePercent: number
  deliveryMode: DeliveryMode
  estimatedDelivery: string
}

export interface DeliveryRoute {
  id: string
  name: string
  fromSettlementId: string
  toSettlementIds: string[]
  deliveryMode: DeliveryMode
  driverId?: string
  status: "planned" | "active" | "completed"
  points: { lat: number; lng: number }[]
}

export interface OrderItem {
  productId: string
  productName?: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  userId: string
  procurementId: string
  status: OrderStatus
  items: OrderItem[]
  pickupPointId: string
  total: number
  comment?: string
  createdAt: string
  timeline: { status: OrderStatus; at: string; label: string }[]
}

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export const settlements: Settlement[] = [
  {
    id: "s1",
    name: "с. Хандыга",
    ulus: "Томпонский",
    population: 6800,
    coordinates: { lat: 62.653, lng: 135.572 },
  },
  {
    id: "s2",
    name: "с. Верхневилюйск",
    ulus: "Верхневилюйский",
    population: 6200,
    coordinates: { lat: 63.445, lng: 120.317 },
  },
  {
    id: "s3",
    name: "г. Нерюнгри",
    ulus: "Нерюнгринский",
    population: 57000,
    coordinates: { lat: 56.668, lng: 124.711 },
  },
]

export const pickupPoints: PickupPoint[] = [
  {
    id: "pp1",
    settlementId: "s1",
    name: "Пункт выдачи — Дом культуры",
    address: "ул. Ленина, 12",
    coordinatorName: "Иванов А.П.",
    coordinatorPhone: "+7 (41167) 2-34-56",
    coordinates: { lat: 62.654, lng: 135.571 },
  },
  {
    id: "pp2",
    settlementId: "s2",
    name: "Пункт выдачи — Администрация",
    address: "ул. Ойунского, 5",
    coordinatorName: "Петрова М.С.",
    coordinatorPhone: "+7 (41162) 3-11-22",
    coordinates: { lat: 63.446, lng: 120.318 },
  },
]

export const categories: Category[] = [
  { id: "c1", name: "Продукты", slug: "food", icon: "Milk" },
  { id: "c2", name: "Бытовая химия", slug: "household", icon: "Sparkles" },
  { id: "c3", name: "Медикаменты", slug: "pharmacy", icon: "Pill" },
  { id: "c4", name: "Хозтовары", slug: "hardware", icon: "Wrench" },
]

export const products: Product[] = [
  {
    id: "p1",
    name: "Рис «Якутский» 5 кг",
    description: "Длительное хранение, подходит для удалённых складов.",
    price: 890,
    categoryId: "c1",
    imageUrl: "/images/products/rice.jpg",
    weightKg: 5,
    unit: "мешок",
    popular: true,
  },
  {
    id: "p2",
    name: "Сгущённое молоко (упаковка 12 шт.)",
    description: "Консервы для длительной логистики по зимнику.",
    price: 1240,
    categoryId: "c1",
    imageUrl: "/images/products/milk.jpg",
    weightKg: 4.2,
    unit: "упаковка",
    popular: true,
  },
  {
    id: "p3",
    name: "Стиральный порошок 3 кг",
    description: "Концентрированный, экономичный расход.",
    price: 650,
    categoryId: "c2",
    imageUrl: "/images/products/powder.jpg",
    weightKg: 3,
    unit: "упаковка",
  },
  {
    id: "p4",
    name: "Аптечка первой помощи",
    description: "Базовый набор для удалённых населённых пунктов.",
    price: 2100,
    categoryId: "c3",
    imageUrl: "/images/products/firstaid.jpg",
    weightKg: 0.8,
    unit: "комплект",
    popular: true,
  },
  {
    id: "p5",
    name: "Герметик морозостойкий",
    description: "Для ремонта жилья в условиях низких температур.",
    price: 480,
    categoryId: "c4",
    imageUrl: "/images/products/sealant.jpg",
    weightKg: 0.3,
    unit: "туба",
  },
  {
    id: "p6",
    name: "Масло подсолнечное 5 л",
    description: "Пищевое масло, тара для транспортировки по реке.",
    price: 720,
    categoryId: "c1",
    imageUrl: "/images/products/oil.jpg",
    weightKg: 4.6,
    unit: "канистра",
  },
]

export const deliveryRoutes: DeliveryRoute[] = [
  {
    id: "r1",
    name: "Якутск → Верхневилюйский улус",
    fromSettlementId: "s3",
    toSettlementIds: ["s2"],
    deliveryMode: "winter_road",
    driverId: "d1",
    status: "active",
    points: [
      { lat: 62.035, lng: 129.675 },
      { lat: 63.445, lng: 120.317 },
    ],
  },
  {
    id: "r2",
    name: "Нерюнгри → Томпонский район",
    fromSettlementId: "s3",
    toSettlementIds: ["s1"],
    deliveryMode: "mixed",
    driverId: "d1",
    status: "planned",
    points: [
      { lat: 56.668, lng: 124.711 },
      { lat: 62.653, lng: 135.572 },
    ],
  },
]

export const procurements: Procurement[] = [
  {
    id: "pr1",
    title: "Сбор «Якутск — Вилюй»",
    routeId: "r1",
    status: "open",
    closesAt: "2026-05-22T18:00:00Z",
    minVolumePercent: 100,
    currentVolumePercent: 73,
    deliveryMode: "winter_road",
    estimatedDelivery: "2026-05-28T12:00:00Z",
  },
  {
    id: "pr2",
    title: "Сбор «Нерюнгри — Томпон»",
    routeId: "r2",
    status: "open",
    closesAt: "2026-05-28T18:00:00Z",
    minVolumePercent: 100,
    currentVolumePercent: 41,
    deliveryMode: "mixed",
    estimatedDelivery: "2026-06-05T12:00:00Z",
  },
]

export const orders: Order[] = [
  {
    id: "ord-001",
    userId: "u1",
    procurementId: "pr1",
    status: "in_transit",
    items: [
      { productId: "p1", quantity: 2, price: 890 },
      { productId: "p2", quantity: 1, price: 1240 },
    ],
    pickupPointId: "pp1",
    total: 3020,
    createdAt: "2026-05-01T10:00:00Z",
    timeline: [
      { status: "pending", at: "2026-05-01T10:00:00Z", label: "Заказ создан" },
      { status: "collecting", at: "2026-05-03T14:00:00Z", label: "Сбор открыт" },
      { status: "confirmed", at: "2026-05-10T09:00:00Z", label: "Сбор закрыт" },
      { status: "in_transit", at: "2026-05-14T08:00:00Z", label: "В пути по маршруту" },
    ],
  },
  {
    id: "ord-002",
    userId: "u1",
    procurementId: "pr2",
    status: "delivered",
    items: [{ productId: "p4", quantity: 1, price: 2100 }],
    pickupPointId: "pp1",
    total: 2100,
    createdAt: "2026-04-02T11:00:00Z",
    timeline: [
      { status: "pending", at: "2026-04-02T11:00:00Z", label: "Заказ создан" },
      { status: "delivered", at: "2026-04-18T16:00:00Z", label: "Выдан в пункте" },
    ],
  },
]

export const notifications: Notification[] = [
  {
    id: "n1",
    userId: "u1",
    title: "Сбор закрыт",
    body: "Сбор «Якутск — Вилюй» набрал минимальный объём. Ожидайте отгрузку.",
    read: false,
    createdAt: "2026-05-10T09:05:00Z",
  },
  {
    id: "n2",
    userId: "u1",
    title: "Заказ в пути",
    body: "Ваш заказ ord-001 передан водителю. Ориентир — 18 мая.",
    read: true,
    createdAt: "2026-05-14T08:30:00Z",
  },
]

export const users: User[] = [
  {
    id: "u1",
    name: "Алексей Семёнов",
    phone: "+7 (914) 123-45-67",
    email: "alexey@example.com",
    role: "client",
    settlementId: "s1",
  },
  {
    id: "d1",
    name: "Михаил Васильев",
    phone: "+7 (914) 987-65-43",
    email: "driver@example.com",
    role: "driver",
    settlementId: "s3",
  },
  {
    id: "e1",
    name: "Сотрудник ПВЗ",
    phone: "+7 (914) 555-55-55",
    email: "employee@example.com",
    role: "employee",
    settlementId: "s1",
  },
  {
    id: "a1",
    name: "Администратор",
    phone: "+7 (4112) 000-00-01",
    email: "admin@example.com",
    role: "admin",
    settlementId: "s3",
  },
]

export const driverApplications: DriverApplication[] = [
  {
    id: "da-001",
    userId: "u1",
    status: "pending",
    submittedAt: "2026-05-18T09:10:00Z",
    vehicleSummary: "Toyota HiAce · А123ВС14 · 1.2т",
  },
  {
    id: "da-002",
    userId: "u1",
    status: "rejected",
    submittedAt: "2026-04-03T10:00:00Z",
    reviewedAt: "2026-04-04T12:30:00Z",
    rejectionReason: "Нечитаемое фото паспорта. Загрузите заново разворот с фото.",
    vehicleSummary: "ГАЗель · В456DE14 · 1.5т",
  },
]

export const pvzEmployees: PvzEmployeeProfile[] = [
  { userId: "e1", pickupPointId: "pp1" },
]

export const adminStats = {
  activeProcurements: 12,
  settlements: 48,
  participants: 1240,
  ordersToday: 34,
  revenueMonth: 2_450_000,
  driversActive: 8,
}
