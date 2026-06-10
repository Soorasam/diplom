import type { ReactNode } from "react"

type MobilePageLayoutProps = {
  children: ReactNode
}

export const MobilePageLayout = ({ children }: MobilePageLayoutProps) => (
  <div className="app-canvas font-sans">{children}</div>
)
