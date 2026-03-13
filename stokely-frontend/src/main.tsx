import React from 'react'
import ReactDOM from 'react-dom/client'
import Layout from './Layout.tsx'
import Landing from './components/LandingPage/Landing.tsx'
import ErrorPage from './ErrorPage.tsx'
import Dashboard from './components/Dashboard/Dashboard.tsx'
import RegisterPage from './components/UserActionPages/RegisterPage.tsx'
import './index.css'
import store from './redux/store.ts';
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from './components/UserActionPages/LoginPage.tsx'
import ForgotPasswordPage from './components/UserActionPages/ForgotPasswordPage.tsx'
import ResetPasswordPage from './components/UserActionPages/ResetPasswordPage.tsx'
import VerifyEmailPage from './components/UserActionPages/VerifyEmailPage.tsx'
import PrivacyPolicyPage from './components/Legal/PrivacyPolicyPage.tsx'
import { Toaster } from 'react-hot-toast'
import { E2EEProvider } from './context/E2EEContext.tsx'

// Trusted Types compatibility bootstrap (safe no-op on unsupported browsers).
if (typeof window !== 'undefined') {
  const tt = (window as Window & { trustedTypes?: { createPolicy?: (name: string, rules: { createHTML?: (input: string) => string; createScriptURL?: (input: string) => string; }) => unknown } }).trustedTypes;
  if (tt?.createPolicy) {
    try {
      tt.createPolicy('stokely', {
        createHTML: input => input,
        createScriptURL: input => input,
      });
    } catch {
      // Policy already exists or browser blocks duplicate policy creation.
    }
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Landing /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "privacy-policy", element: <PrivacyPolicyPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <E2EEProvider>
      <React.StrictMode>
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: { background: '#1e1e1e', color: '#fff', border: '1px solid #333' },
          }}
        />
        <RouterProvider router={router} />
      </React.StrictMode>
    </E2EEProvider>
  </Provider>,
)
