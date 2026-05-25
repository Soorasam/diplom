import { routes } from "@/shared/config/routes"
import type { UserRole } from "@/shared/types"

export type ProfileRouteSet = {
  profile: string
  profileEdit: string
  disputes: string
  dispute: (id: string) => string
  notifications: string
  support: string
  addresses: string
  pickupPoints: string
  orders: string
}

const userRoutes: ProfileRouteSet = {
  profile: routes.user.profile,
  profileEdit: routes.user.profileEdit,
  disputes: routes.user.disputes,
  dispute: routes.user.dispute,
  notifications: routes.user.notifications,
  support: routes.user.support,
  addresses: routes.user.addresses,
  pickupPoints: routes.user.pickupPoints,
  orders: routes.user.orders,
}

const driverRoutes: ProfileRouteSet = {
  profile: routes.driver.profile,
  profileEdit: routes.driver.profileEdit,
  disputes: routes.driver.disputes,
  dispute: routes.driver.dispute,
  notifications: routes.driver.notifications,
  support: routes.driver.support,
  addresses: routes.user.addresses,
  pickupPoints: routes.user.pickupPoints,
  orders: routes.user.orders,
}

const adminRoutes: ProfileRouteSet = {
  profile: routes.admin.profile,
  profileEdit: routes.user.profileEdit,
  disputes: routes.user.disputes,
  dispute: routes.user.dispute,
  notifications: routes.user.notifications,
  support: routes.user.support,
  addresses: routes.user.addresses,
  pickupPoints: routes.user.pickupPoints,
  orders: routes.user.orders,
}

const employeeRoutes: ProfileRouteSet = {
  profile: routes.employee.profile,
  profileEdit: routes.employee.profileEdit,
  disputes: routes.user.disputes,
  dispute: routes.user.dispute,
  notifications: routes.user.notifications,
  support: routes.user.support,
  addresses: routes.user.addresses,
  pickupPoints: routes.user.pickupPoints,
  orders: routes.user.orders,
}

export function profileRoutesFromPathname(pathname: string): ProfileRouteSet {
  if (pathname.startsWith(routes.admin.root)) return adminRoutes
  if (pathname.startsWith(routes.driver.root)) return driverRoutes
  if (pathname.startsWith(routes.employee.root)) return employeeRoutes
  if (pathname === routes.user.root || pathname.startsWith(`${routes.user.root}/`)) {
    return userRoutes
  }
  return userRoutes
}

export function profileRoutesForRole(role: UserRole): ProfileRouteSet {
  if (role === "admin") return adminRoutes
  if (role === "driver") return driverRoutes
  if (role === "employee") return employeeRoutes
  return userRoutes
}
