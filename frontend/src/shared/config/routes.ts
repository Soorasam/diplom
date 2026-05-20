/** Централизованные пути — единый источник для router и Link */
export const routes = {
  auth: "/auth",

  home: "/",
  catalog: "/catalog",
  product: (id: string) => `/product/${id}`,
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  order: (id: string) => `/orders/${id}`,
  activeProcurements: "/active-procurements",
  profile: "/profile",
  notifications: "/notifications",
  support: "/support",
  addresses: "/addresses",
  pickupPoints: "/pickup-points",

  driver: {
    root: "/driver",
    procurements: "/driver/procurements",
    route: "/driver/route",
    orders: "/driver/orders",
    map: "/driver/map",
  },

  driverApply: "/driver-apply",

  employee: {
    root: "/employee",
    procurements: "/employee/procurements",
    orders: "/employee/orders",
    scan: "/employee/scan",
  },

  admin: {
    root: "/admin",
    users: "/admin/users",
    orders: "/admin/orders",
    products: "/admin/products",
    routes: "/admin/routes",
    procurements: "/admin/procurements",
    drivers: "/admin/drivers",
    settlements: "/admin/settlements",
    analytics: "/admin/analytics",
    driverApplications: "/admin/driver-applications",
    pvz: "/admin/pvz",
    tickets: "/admin/tickets",
  },
} as const
