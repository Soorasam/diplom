import { RouterProvider } from "react-router-dom"

import { AppProviders } from "@/app/providers/AppProviders"
import { router } from "@/app/router"

import "./index.css"

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App
