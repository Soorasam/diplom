import { useEffect, useRef, type RefObject } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  resolveSwipeTabIndex,
  swipeTabRoutes,
} from "@/shared/config/swipe-tabs"

const MIN_SWIPE_DISTANCE = 56
const MAX_VERTICAL_DRIFT = 72

type SwipeDirection = "left" | "right"

interface TouchState {
  x: number
  y: number
  active: boolean
  ignored: boolean
}

const getBottomNavTop = () => {
  const nav = document.querySelector<HTMLElement>("[data-bottom-nav]")
  return nav?.getBoundingClientRect().top ?? window.innerHeight
}

const isIgnoredTarget = (target: EventTarget | null, root: HTMLElement) => {
  const element = target as HTMLElement | null
  if (!element) return false

  if (element.closest("[data-bottom-nav]")) return true
  if (element.closest("[data-no-swipe]")) return true

  let node: HTMLElement | null = element

  while (node && node !== root) {
    const { overflowX } = window.getComputedStyle(node)
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      node.scrollWidth > node.clientWidth + 1
    ) {
      return true
    }

    node = node.parentElement
  }

  return false
}

const isTouchInSwipeZone = (
  clientX: number,
  clientY: number,
  root: HTMLElement,
) => {
  if (clientY >= getBottomNavTop()) return false

  const rect = root.getBoundingClientRect()
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  )
}

export const useSwipeTabs = (
  containerRef: RefObject<HTMLElement | null>,
  onSwipe?: (direction: SwipeDirection) => void,
) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const touchRef = useRef<TouchState>({
    x: 0,
    y: 0,
    active: false,
    ignored: false,
  })

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      if (resolveSwipeTabIndex(pathname) === null) return

      const touch = event.touches[0]
      if (!isTouchInSwipeZone(touch.clientX, touch.clientY, root)) return

      const target = event.target
      const ignored =
        target instanceof Node && root.contains(target)
          ? isIgnoredTarget(target, root)
          : false

      touchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        active: true,
        ignored,
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      const state = touchRef.current
      touchRef.current = { ...state, active: false }

      if (!state.active || state.ignored) return

      const tabIndex = resolveSwipeTabIndex(pathname)
      if (tabIndex === null) return

      const touch = event.changedTouches[0]
      if (!isTouchInSwipeZone(touch.clientX, touch.clientY, root)) return

      const deltaX = touch.clientX - state.x
      const deltaY = touch.clientY - state.y

      if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE) return
      if (Math.abs(deltaY) > MAX_VERTICAL_DRIFT) return
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return

      if (deltaX < 0 && tabIndex < swipeTabRoutes.length - 1) {
        onSwipe?.("left")
        navigate(swipeTabRoutes[tabIndex + 1])
        return
      }

      if (deltaX > 0 && tabIndex > 0) {
        onSwipe?.("right")
        navigate(swipeTabRoutes[tabIndex - 1])
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true })
    document.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", onTouchStart)
      document.removeEventListener("touchend", onTouchEnd)
    }
  }, [containerRef, navigate, onSwipe, pathname])
}
