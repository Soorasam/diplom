import { Navigate } from "react-router-dom"
import { homeRouteForRole, useAuthStore } from "@/app/model/auth-store"
import { useProcurementLocationSync } from "@/features/procurement/hooks/useProcurementLocationSync"
import { SwipeableOutlet } from "@/features/swipe-tabs/ui/SwipeableOutlet"
import { MobilePageLayout } from "@/shared/ui/mobile-page-layout/MobilePageLayout"
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav"
import { ProcurementLiveSync } from "@/widgets/procurement-live-sync/ui/ProcurementLiveSync"

export const AppLayout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  useProcurementLocationSync()

  if (isAuthenticated && user && user.role !== "client") {
    return <Navigate to={homeRouteForRole(user.role)} replace />
  }

  return (
    <MobilePageLayout>
      <ProcurementLiveSync />
      <main className="app-scroll-area mx-auto flex w-full max-w-[480px] flex-col">
        <SwipeableOutlet />
      </main>
      <BottomNav />
    </MobilePageLayout>
  )
}
