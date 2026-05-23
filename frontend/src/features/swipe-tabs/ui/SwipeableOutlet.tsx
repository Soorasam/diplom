import { useRef, useState } from "react"

import { Outlet, useLocation } from "react-router-dom"



import { useSwipeTabs } from "@/features/swipe-tabs/hooks/useSwipeTabs"

import { cn } from "@/shared/lib/cn"



type SwipeDirection = "left" | "right"



export const SwipeableOutlet = () => {

  const swipeRef = useRef<HTMLDivElement>(null)

  const { pathname } = useLocation()

  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null)



  useSwipeTabs(swipeRef, (direction) => {

    setSwipeDirection(direction)

  })



  return (

    <div

      ref={swipeRef}

      data-swipe-root

      className="app-canvas flex min-h-dvh w-full touch-pan-y"

    >

      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">

        <div

          key={pathname}

          className={cn(

            "flex min-h-full flex-1 flex-col",

            swipeDirection === "left" && "page-slide-from-right",

            swipeDirection === "right" && "page-slide-from-left",

          )}

          onAnimationEnd={() => setSwipeDirection(null)}

        >

          <Outlet />

        </div>

      </main>

    </div>

  )

}

