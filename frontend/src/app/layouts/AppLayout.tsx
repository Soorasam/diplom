import { SwipeableOutlet } from "@/features/swipe-tabs/ui/SwipeableOutlet"
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav"

export const AppLayout = () => {
  return (
    <div className="bg-gradient-to-b from-slate-100 via-blue-50/30 to-slate-50">
      <SwipeableOutlet />
      <BottomNav />
    </div>
  )
}
