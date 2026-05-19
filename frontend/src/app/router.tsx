import { createBrowserRouter } from "react-router-dom"

import { AppLayout } from "./layouts/AppLayout"
import { AdminLayout } from "./layouts/AdminLayout"
import { DriverLayout } from "./layouts/DriverLayout"

import { HomePage } from "@/pages/home/ui/HomePage"
import { CatalogPage } from "@/pages/catalog/ui/CatalogPage"
import { ProductPage } from "@/pages/product/ui/ProductPage"
import { CartPage } from "@/pages/cart/ui/CartPage"
import { CheckoutPage } from "@/pages/checkout/ui/CheckoutPage"
import { OrdersPage } from "@/pages/orders/ui/OrdersPage"
import { OrderDetailsPage } from "@/pages/order-details/ui/OrderDetailsPage"
import { ProfilePage } from "@/pages/profile/ui/ProfilePage"
import { NotificationsPage } from "@/pages/notifications/ui/NotificationsPage"
import { SupportPage } from "@/pages/support/ui/SupportPage"
import { AddressesPage } from "@/pages/addresses/ui/AddressesPage"
import { PickupPointsPage } from "@/pages/pickup-points/ui/PickupPointsPage"
import { AuthPage } from "@/pages/auth/ui/AuthPage"
import { NotFoundPage } from "@/pages/not-found/ui/NotFoundPage"

import { DriverDashboardPage } from "@/pages/driver/dashboard/ui/DriverDashboardPage"
import { DriverRoutePage } from "@/pages/driver/route/ui/DriverRoutePage"
import { DriverOrdersPage } from "@/pages/driver/orders/ui/DriverOrdersPage"
import { DriverMapPage } from "@/pages/driver/map/ui/DriverMapPage"

import { AdminDashboardPage } from "@/pages/admin/dashboard/ui/AdminDashboardPage"
import { AdminUsersPage } from "@/pages/admin/users/ui/AdminUsersPage"
import { AdminOrdersPage } from "@/pages/admin/orders/ui/AdminOrdersPage"
import { AdminProductsPage } from "@/pages/admin/products/ui/AdminProductsPage"
import { AdminRoutesPage } from "@/pages/admin/routes/ui/AdminRoutesPage"
import { AdminDriversPage } from "@/pages/admin/drivers/ui/AdminDriversPage"
import { AdminSettlementsPage } from "@/pages/admin/settlements/ui/AdminSettlementsPage"
import { AdminAnalyticsPage } from "@/pages/admin/analytics/ui/AdminAnalyticsPage"

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },

  {
    path: "/driver",
    element: <DriverLayout />,
    children: [
      { index: true, element: <DriverDashboardPage /> },
      { path: "route", element: <DriverRoutePage /> },
      { path: "orders", element: <DriverOrdersPage /> },
      { path: "map", element: <DriverMapPage /> },
    ],
  },

  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "orders", element: <AdminOrdersPage /> },
      { path: "products", element: <AdminProductsPage /> },
      { path: "routes", element: <AdminRoutesPage /> },
      { path: "drivers", element: <AdminDriversPage /> },
      { path: "settlements", element: <AdminSettlementsPage /> },
      { path: "analytics", element: <AdminAnalyticsPage /> },
    ],
  },

  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFoundPage />,

    children: [
      { index: true, element: <HomePage /> },
      { path: "catalog", element: <CatalogPage /> },
      { path: "product/:id", element: <ProductPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderDetailsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "support", element: <SupportPage /> },
      { path: "addresses", element: <AddressesPage /> },
      { path: "pickup-points", element: <PickupPointsPage /> },
    ],
  },
],
{
  basename: "/diplom",
})
