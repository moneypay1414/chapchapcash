import { useState, useEffect } from 'react';
import { useAuthStore } from '../context/store';
import PrintReceipt from '../components/PrintReceipt';
import { transactionAPI, authAPI } from '../utils/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import Footer from '../components/Footer';
import '../styles/dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch updated user profile to ensure balance is current
        const { data: userData } = await authAPI.getProfile();
        updateUser(userData);

        // Fetch transaction stats
        const { data: statsData } = await transactionAPI.getStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [updateUser]);

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Sent (SSP)',
        data: [5000, 7000, 6500, 8000],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Received (SSP)',
        data: [10000, 12000, 11500, 13000],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const doughnutData = {
    labels: ['Transfers', 'Withdrawals', 'Others'],
    datasets: [
      {
        data: [60, 30, 10],
        backgroundColor: ['#2563eb', '#f59e0b', '#10b981'],
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  };

  return (
    <>
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name}! 👋</h1>
          <p className="text-muted">Your MoneyPay Dashboard</p>
          {user?.currentLocation && (
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              📍 {user.currentLocation.city}, {user.currentLocation.country}
            </p>
          )}
        </div>
      </div>

      <div className="dashboard-grid grid-4">
        <div className="stat-card balance-card">
          <div className="stat-icon balance">💰</div>
          <div className="stat-content">
            <p className="stat-label">My Wallet</p>
            <h3 className="stat-value">SSP {(parseFloat(user?.balance) || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sent">📤</div>
          <div className="stat-content">
            <p className="stat-label">Money Sent</p>
            <h3 className="stat-value">SSP {(parseFloat(stats?.totalSent) || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon received">📥</div>
          <div className="stat-content">
            <p className="stat-label">Total Received</p>
            <h3 className="stat-value">SSP {(parseFloat(stats?.totalReceived) || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon transactions">📊</div>
          <div className="stat-content">
            <p className="stat-label">Total Transactions</p>
            <h3 className="stat-value">{stats?.totalTransactions || 0}</h3>
          </div>
        </div>
      </div>

      <div className="charts-grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Transaction History</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <p className="text-center text-muted">Loading chart...</p>
            ) : (
              <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Transaction Types</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <p className="text-center text-muted">Loading chart...</p>
            ) : (
              <div style={{ maxHeight: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header flex-between">
          <h3>Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="actions-grid">
            <a href="/user/send-money" className="action-card">
              <div className="action-icon">📤</div>
              <h4>Send Money</h4>
              <p>Transfer to another user</p>
            </a>
            <a href="/user/withdraw" className="action-card">
              <div className="action-icon">💵</div>
              <h4>Withdraw</h4>
              <p>Cash out to agent</p>
            </a>
            <a href="/user/transactions" className="action-card">
              <div className="action-icon">📋</div>
              <h4>Transactions</h4>
              <p>View history</p>
            </a>
            <a href="/user/profile" className="action-card">
              <div className="action-icon">👤</div>
              <h4>Profile</h4>
              <p>Manage account</p>
            </a>
          </div>
        </div>
      </div>
      {selectedTransaction && (
        <PrintReceipt
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
    <Footer />
    </>
  );
}
