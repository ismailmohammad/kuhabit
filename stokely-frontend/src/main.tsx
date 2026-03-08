import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './Home.tsx'
import ErrorPage from './ErrorPage.tsx'
import Dashboard from './components/Dashboard/Dashboard.tsx'
import RegisterPage from './components/UserActionPages/RegisterPage.tsx'
import './index.css'
import store from './redux/store.ts';
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from './components/UserActionPages/LoginPage.tsx'
import { Toaster } from 'react-hot-toast'

const router = createBrowserRouter([
  { path: "/", element: <Home />, errorElement: <ErrorPage /> },
  { path: "/dashboard", element: <Dashboard />, errorElement: <ErrorPage /> },
  { path: "/login", element: <LoginPage />, errorElement: <ErrorPage /> },
  { path: "/register", element: <RegisterPage />, errorElement: <ErrorPage /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <React.StrictMode>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e1e1e', color: '#fff', border: '1px solid #333' },
        }}
      />
      <RouterProvider router={router} />
    </React.StrictMode>
  </Provider>,
)
