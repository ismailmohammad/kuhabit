import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './Home.tsx'
import ErrorPage from './ErrorPage.tsx'
import Dashboard from './components/Dashboard/Dashboard.tsx'
import './index.css'


import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    errorElement: <ErrorPage />
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
