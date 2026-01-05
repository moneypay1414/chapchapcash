import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/store'

// Theme provider component
function ThemeProvider({ children }) {
  React.useEffect(() => {
    const theme = useAuthStore.getState().theme || 'light'
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [])

  return children
}

// Suppress React Router v7 startTransition warning since we've already opted in via the future flag
const originalWarn = console.warn
console.warn = (...args) => {
  if (args[0]?.includes?.('React Router will begin wrapping state updates in')) {
    return
  }
  originalWarn(...args)
}

// Protected Route wrapper component
function ProtectedRoute({ children, requiredRole }) {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !requiredRole.includes(user?.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Pages
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import AdminRegister from './pages/AdminRegister'
import UserLayout from './components/UserLayout'
import UserDashboard from './pages/UserDashboard'
import SendMoney from './pages/SendMoney'
import Withdraw from './pages/Withdraw'
import Transactions from './pages/Transactions'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminTransactions from './pages/AdminTransactions'
import AdminNotifications from './pages/AdminNotifications'
import AdminTopup from './pages/AdminTopup'
import AdminWithdraw from './pages/AdminWithdraw'
import AdminPushMoney from './pages/AdminPushMoney'
import AdminProfile from './pages/AdminProfile'
import AdminSettings from './pages/AdminSettings'
import AdminTieredCommission from './pages/AdminTieredCommission'
import AdminStateSettings from './pages/AdminStateSettings'
import AdminStateSend from './pages/AdminStateSend'
import AdminStatePending from './pages/AdminStatePending'
import AdminCurrency from './pages/AdminCurrency'
import AdminCurrencyRates from './pages/AdminCurrencyRates'
import AdminMoneyExchange from './pages/AdminMoneyExchange'
import AgentDashboard from './pages/AgentDashboard'
import AgentWithdraw from './pages/AgentWithdraw'
import PendingWithdrawals from './pages/PendingWithdrawals'
import PendingAdminRequests from './pages/PendingAdminRequests'
import Designing from './pages/Designing'
import RouteError from './pages/RouteError'

import './styles/globals.css'

const router = createBrowserRouter(
  [
    {
      // Root route with errorElement to catch and render any route errors
      path: '/',
      errorElement: <RouteError />,
      children: [
        { path: '/', element: <Navigate to="/login" replace /> },
        { path: '/login', element: <Login /> },
        { path: '/admin-login', element: <AdminLogin /> },
        { path: '/admin-register', element: <AdminRegister /> },
        { path: '/register', element: <Register /> },
        {
          path: '/user',
          element: (
            <ProtectedRoute requiredRole={["user"]}>
              <UserLayout />
            </ProtectedRoute>
          ),
          children: [
            { path: 'dashboard', element: <UserDashboard /> },
            { path: 'send-money', element: <SendMoney /> },
            { path: 'withdraw', element: <Withdraw /> },
            { path: 'pending-withdrawals', element: <PendingWithdrawals /> },
            { path: 'designing', element: <Designing /> },
            { path: 'transactions', element: <Transactions /> },
            { path: 'notifications', element: <Notifications /> },
            { path: 'profile', element: <Profile /> }
          ]
        },
        {
          path: '/agent',
          element: (
            <ProtectedRoute requiredRole={["agent"]}>
              <UserLayout />
            </ProtectedRoute>
          ),
          children: [
            { path: 'dashboard', element: <AgentDashboard /> },
            { path: 'send-money', element: <SendMoney /> },
            { path: 'withdraw', element: <Withdraw /> },
            { path: 'pull-from-user', element: <AgentWithdraw /> },
            { path: 'pending-withdrawals', element: <PendingWithdrawals /> },
            { path: 'pending-admin-requests', element: <PendingAdminRequests /> },
            { path: 'designing', element: <Designing /> },
            { path: 'transactions', element: <Transactions /> },
            { path: 'notifications', element: <Notifications /> },
            { path: 'profile', element: <Profile /> }
          ]
        },
        {
          path: '/admin',
          element: (
            <ProtectedRoute requiredRole={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          ),
          children: [
            { path: 'dashboard', element: <AdminDashboard /> },
            { path: 'users', element: <AdminUsers /> },
            { path: 'transactions', element: <AdminTransactions /> },
            { path: 'notifications', element: <AdminNotifications /> },
            { path: 'topup', element: <AdminTopup /> },
            { path: 'push-money', element: <AdminPushMoney /> },
            { path: 'withdraw-agent', element: <AdminWithdraw /> },
            { path: 'tiered-commission', element: <AdminTieredCommission /> },
            { path: 'currencies', element: <AdminCurrency /> },
            { path: 'currency-rates', element: <AdminCurrencyRates /> },
            { path: 'money-exchange', element: <AdminMoneyExchange /> },
            { path: 'state-settings', element: <AdminStateSettings /> },
            { path: 'send-state', element: <AdminStateSend /> },
            { path: 'send-state-pending', element: <AdminStatePending /> },
            { path: 'settings', element: <AdminSettings /> },
            { path: 'profile', element: <AdminProfile /> }
          ]
        }
      ]
    }
  ],
  {
    future: {
      v7_startTransition: true
    }
  }
)
 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
