import { Outlet } from "react-router-dom"

import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav"

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-blue-50/30 to-slate-50">
      <main className="mx-auto max-w-[480px] pb-20 page-enter safe-bottom">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
