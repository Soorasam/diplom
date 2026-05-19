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
  profile: "/profile",
  notifications: "/notifications",
  support: "/support",
  addresses: "/addresses",
  pickupPoints: "/pickup-points",

  driver: {
    root: "/driver",
    route: "/driver/route",
    orders: "/driver/orders",
    map: "/driver/map",
  },

  admin: {
    root: "/admin",
    users: "/admin/users",
    orders: "/admin/orders",
    products: "/admin/products",
    routes: "/admin/routes",
    drivers: "/admin/drivers",
    settlements: "/admin/settlements",
    analytics: "/admin/analytics",
  },
} as const
