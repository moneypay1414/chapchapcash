import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/store';
import './styles/globals.css';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// User Pages
import UserLayout from './components/UserLayout';
import UserDashboard from './pages/UserDashboard';
import SendMoney from './pages/SendMoney';
import Withdraw from './pages/Withdraw';
import Transactions from './pages/Transactions';
import Notifications from './pages/Notifications';

// Admin Pages
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminTransactions from './pages/AdminTransactions';
import AdminNotifications from './pages/AdminNotifications';

function ProtectedRoute({ children, requiredRole }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !requiredRole.includes(user?.role)) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default function App() {
  return null;
}
