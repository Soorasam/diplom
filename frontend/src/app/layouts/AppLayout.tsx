import { Navigate } from "react-router-dom"
import { homeRouteForRole, useAuthStore } from "@/app/model/auth-store"
import { SwipeableOutlet } from "@/features/swipe-tabs/ui/SwipeableOutlet"
import { MobilePageLayout } from "@/shared/ui/mobile-page-layout/MobilePageLayout"
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav"

export const AppLayout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (isAuthenticated && user && user.role !== "client") {
    return <Navigate to={homeRouteForRole(user.role)} replace />
  }

  return (
    <MobilePageLayout>
      <SwipeableOutlet />
      <BottomNav />
    </MobilePageLayout>
  )
}
