import { createBrowserRouter, Navigate, useParams } from "react-router-dom"

import { RootShell } from "./providers/RootShell"
import { AppLayout } from "./layouts/AppLayout"
import { AdminLayout } from "./layouts/AdminLayout"
import { DriverLayout } from "./layouts/DriverLayout"

import { RequireRole } from "@/features/auth/ui/RequireRole"

import { HomePage } from "@/pages/home/ui/HomePage"
import { CatalogPage } from "@/pages/catalog/ui/CatalogPage"
import { ProductPage } from "@/pages/product/ui/ProductPage"
import { CartPage } from "@/pages/cart/ui/CartPage"
import { CheckoutPage } from "@/pages/checkout/ui/CheckoutPage"
import { OrdersPage } from "@/pages/orders/ui/OrdersPage"
import { ActiveProcurementsPage } from "@/pages/active-procurements/ui/ActiveProcurementsPage"
import { ProcurementDetailPage } from "@/pages/procurement-detail/ui/ProcurementDetailPage"
import { PaymentPage } from "@/pages/payment/ui/PaymentPage"
import { OrderDetailsPage } from "@/pages/order-details/ui/OrderDetailsPage"
import { MyDisputesPage } from "@/pages/disputes/ui/MyDisputesPage"
import { CreateDisputePage } from "@/pages/disputes/ui/CreateDisputePage"
import { EditProfilePage } from "@/pages/profile-edit/ui/EditProfilePage"
import { ProfilePage } from "@/pages/profile/ui/ProfilePage"
import { NotificationsPage } from "@/pages/notifications/ui/NotificationsPage"
import { SupportPage } from "@/pages/support/ui/SupportPage"
import { AddressesPage } from "@/pages/addresses/ui/AddressesPage"
import { PickupPointsPage } from "@/pages/pickup-points/ui/PickupPointsPage"
import { AuthPage } from "@/pages/auth/ui/AuthPage"
import { NotFoundPage } from "@/pages/not-found/ui/NotFoundPage"
import { DriverApplyPage } from "@/pages/driver-apply/ui/DriverApplyPage"

import { DriverDashboardPage } from "@/pages/driver/dashboard/ui/DriverDashboardPage"
import { DriverProcurementsPage } from "@/pages/driver/procurements/ui/DriverProcurementsPage"
import { DriverRoutePage } from "@/pages/driver/route/ui/DriverRoutePage"
import { DriverMapPage } from "@/pages/driver/map/ui/DriverMapPage"

import { AdminDashboardPage } from "@/pages/admin/dashboard/ui/AdminDashboardPage"
import { AdminUsersPage } from "@/pages/admin/users/ui/AdminUsersPage"
import { AdminOrdersPage } from "@/pages/admin/orders/ui/AdminOrdersPage"
import { AdminProductsPage } from "@/pages/admin/products/ui/AdminProductsPage"
import { AdminRoutesPage } from "@/pages/admin/routes/ui/AdminRoutesPage"
import { AdminProcurementsPage } from "@/pages/admin/procurements/ui/AdminProcurementsPage"
import { AdminDriversPage } from "@/pages/admin/drivers/ui/AdminDriversPage"
import { AdminSettlementsPage } from "@/pages/admin/settlements/ui/AdminSettlementsPage"
import { AdminAnalyticsPage } from "@/pages/admin/analytics/ui/AdminAnalyticsPage"
import { AdminPvzEmployeesPage } from "@/pages/admin/pvz-employees/ui/AdminPvzEmployeesPage"

import { EmployeeLayout } from "./layouts/EmployeeLayout"
import { EmployeeDashboardPage } from "@/pages/employee/dashboard/ui/EmployeeDashboardPage"
import { EmployeeIntakePage } from "@/pages/employee/intake/ui/EmployeeIntakePage"
import { EmployeeOrdersPage } from "@/pages/employee/orders/ui/EmployeeOrdersPage"
import { EmployeeProcurementsPage } from "@/pages/employee/procurements/ui/EmployeeProcurementsPage"
import { EmployeeScanPage } from "@/pages/employee/scan/ui/EmployeeScanPage"

import { AdminDriverApplicationsPage } from "@/pages/admin/driver-applications/ui/AdminDriverApplicationsPage"
import { AdminPvzPage } from "@/pages/admin/pvz/ui/AdminPvzPage"
import { AdminTicketsPage } from "@/pages/admin/tickets/ui/AdminTicketsPage"
import { routes } from "@/shared/config/routes"

const u = routes.user

const LegacyProductRedirect = () => {
  const { id } = useParams()
  return <Navigate to={u.product(id ?? "")} replace />
}

const LegacyOrderRedirect = () => {
  const { id } = useParams()
  return <Navigate to={u.order(id ?? "")} replace />
}

const LegacyProcurementRedirect = () => {
  const { id } = useParams()
  return <Navigate to={u.procurement(id ?? "")} replace />
}

export const router = createBrowserRouter([
  {
    element: <RootShell />,
    children: [
      { path: "/auth", element: <AuthPage /> },
      { path: "/driver-apply", element: <DriverApplyPage /> },

      { path: "/", element: <Navigate to={u.root} replace /> },
      { path: "catalog", element: <Navigate to={u.catalog} replace /> },
      { path: "product/:id", element: <LegacyProductRedirect /> },
      { path: "cart", element: <Navigate to={u.cart} replace /> },
      { path: "checkout", element: <Navigate to={u.checkout} replace /> },
      { path: "payment", element: <Navigate to={u.payment} replace /> },
      { path: "orders", element: <Navigate to={u.orders} replace /> },
      { path: "orders/:id", element: <LegacyOrderRedirect /> },
      { path: "active-procurements", element: <Navigate to={u.activeProcurements} replace /> },
      { path: "procurements/:id", element: <LegacyProcurementRedirect /> },
      { path: "profile", element: <Navigate to={u.profile} replace /> },
      { path: "profile/edit", element: <Navigate to={u.profileEdit} replace /> },
      { path: "disputes", element: <Navigate to={u.disputes} replace /> },
      { path: "disputes/new", element: <Navigate to="/user/disputes/new" replace /> },
      { path: "notifications", element: <Navigate to={u.notifications} replace /> },
      { path: "support", element: <Navigate to={u.support} replace /> },
      { path: "addresses", element: <Navigate to={u.addresses} replace /> },
      { path: "pickup-points", element: <Navigate to={u.pickupPoints} replace /> },

      {
        path: "/driver",
        element: (
          <RequireRole roles={["driver"]}>
            <DriverLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <DriverDashboardPage /> },
          { path: "procurements", element: <DriverProcurementsPage /> },
          { path: "route", element: <DriverRoutePage /> },
          { path: "map", element: <DriverMapPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "profile/edit", element: <EditProfilePage /> },
          { path: "disputes", element: <MyDisputesPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "support", element: <SupportPage /> },
        ],
      },

      {
        path: "/employee",
        element: (
          <RequireRole roles={["employee"]}>
            <EmployeeLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <EmployeeDashboardPage /> },
          { path: "intake", element: <EmployeeIntakePage /> },
          { path: "handout", element: <EmployeeOrdersPage /> },
          { path: "orders", element: <EmployeeOrdersPage /> },
          { path: "procurements", element: <EmployeeProcurementsPage /> },
          { path: "scan", element: <EmployeeScanPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "profile/edit", element: <EditProfilePage /> },
        ],
      },

      {
        path: "/admin",
        element: (
          <RequireRole roles={["admin"]}>
            <AdminLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "users", element: <AdminUsersPage /> },
          { path: "orders", element: <AdminOrdersPage /> },
          { path: "products", element: <AdminProductsPage /> },
          { path: "routes", element: <AdminRoutesPage /> },
          { path: "procurements", element: <AdminProcurementsPage /> },
          { path: "drivers", element: <AdminDriversPage /> },
          { path: "settlements", element: <AdminSettlementsPage /> },
          { path: "analytics", element: <AdminAnalyticsPage /> },
          { path: "driver-applications", element: <AdminDriverApplicationsPage /> },
          { path: "pvz", element: <AdminPvzPage /> },
          { path: "pvz-employees", element: <AdminPvzEmployeesPage /> },
          { path: "tickets", element: <AdminTicketsPage /> },
          { path: "profile", element: <ProfilePage /> },
        ],
      },

      {
        path: "/user",
        element: <AppLayout />,
        errorElement: <NotFoundPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "catalog", element: <CatalogPage /> },
          { path: "product/:id", element: <ProductPage /> },
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "payment", element: <PaymentPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:id", element: <OrderDetailsPage /> },
          { path: "active-procurements", element: <ActiveProcurementsPage /> },
          { path: "procurements/:id", element: <ProcurementDetailPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "profile/edit", element: <EditProfilePage /> },
          { path: "disputes", element: <MyDisputesPage /> },
          { path: "disputes/new", element: <CreateDisputePage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "support", element: <SupportPage /> },
          { path: "addresses", element: <AddressesPage /> },
          { path: "pickup-points", element: <PickupPointsPage /> },
        ],
      },
    ],
  },
],
{
  basename: import.meta.env.BASE_URL,
})
