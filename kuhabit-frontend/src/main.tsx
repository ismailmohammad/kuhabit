import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './Home.tsx'
import ErrorPage from './ErrorPage.tsx'
import Dashboard from './components/Dashboard/Dashboard.tsx'
import RegisterPage from './components/UserActionPages/RegisterPage.tsx'
import './index.css'
// Using redux to store user info across multiple components
import store from './redux/store';
import { Provider } from 'react-redux'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginPage from './components/UserActionPages/LoginPage.tsx'

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
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <ErrorPage />
  },
  {
    path: "/register",
    element: <RegisterPage />,
    errorElement: <ErrorPage />
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </Provider>,
)
