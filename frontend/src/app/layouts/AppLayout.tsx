import { Outlet } from "react-router-dom"

import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav"

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-[480px] pb-20">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}