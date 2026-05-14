import React from "react"
import { RouterProvider } from "react-router-dom"

import "./index.css"

import { router } from "./app/router"

function App() {
  return (
  <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
}

export default App