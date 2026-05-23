import { SwipeableOutlet } from "@/features/swipe-tabs/ui/SwipeableOutlet"
import { MobilePageLayout } from "@/shared/ui/mobile-page-layout/MobilePageLayout"
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav"

export const AppLayout = () => (
  <MobilePageLayout>
    <SwipeableOutlet />
    <BottomNav />
  </MobilePageLayout>
)
