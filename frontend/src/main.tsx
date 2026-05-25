import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerSW } from "virtual:pwa-register"

import { appBasePath, appPath } from "@/shared/config/app-base"
import App from "./App.tsx"

const redirectRootToUser = () => {
  const path = window.location.pathname
  if (path === appBasePath || path === `${appBasePath}/`) {
    window.history.replaceState(null, "", appPath("user/"))
  }
}

redirectRootToUser()

registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
