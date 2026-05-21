import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerSW } from 'virtual:pwa-register';
import App from "./App.tsx"

const normalizeBasePath = () => {
  const path = window.location.pathname
  if (path === "/diplom") {
    window.history.replaceState(null, "", "/diplom/")
  }
}

normalizeBasePath()

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
