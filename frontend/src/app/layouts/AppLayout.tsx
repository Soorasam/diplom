import { Outlet } from "react-router-dom"

import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav"

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-teal-50/40 to-slate-50">
      <main className="mx-auto max-w-[480px] pb-20">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
