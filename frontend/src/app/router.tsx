import { createBrowserRouter } from "react-router-dom"

import { AppLayout } from "./layouts/AppLayout"

import { HomePage } from "@/pages/home/ui/HomePage"
import { CatalogPage } from "@/pages/catalog/ui/CatalogPage"
import { ProductPage } from "@/pages/product/ui/ProductPage"
import { CartPage } from "@/pages/cart/ui/CartPage"
import { OrdersPage } from "@/pages/orders/ui/OrdersPage"
import { ProfilePage } from "@/pages/profile/ui/ProfilePage"
import { AuthPage } from "@/pages/auth/ui/AuthPage"
import { NotFoundPage } from "@/pages/not-found/ui/NotFoundPage"

export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthPage />,
  },

  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFoundPage />,

    children: [
      {
        index: true,
        element: <HomePage />,
      },

      {
        path: "catalog",
        element: <CatalogPage />,
      },

      {
        path: "product/:id",
        element: <ProductPage />,
      },

      {
        path: "cart",
        element: <CartPage />,
      },

      {
        path: "orders",
        element: <OrdersPage />,
      },

      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  },
])