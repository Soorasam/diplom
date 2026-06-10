import type { ReactNode } from "react"

type MobilePageLayoutProps = {
  children: ReactNode
}

export const MobilePageLayout = ({ children }: MobilePageLayoutProps) => (
  <div className="app-canvas min-h-dvh font-sans">{children}</div>
)
