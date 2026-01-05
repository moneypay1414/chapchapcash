import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import PrintReceipt from '../components/PrintReceipt';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);
import Footer from '../components/Footer';
import '../styles/admin-dashboard.css';
import { useAuthStore } from '../context/store';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const user = useAuthStore((state) => state.user);
  const [myCashedOut, setMyCashedOut] = useState(null);
  const [adminStateCommission, setAdminStateCommission] = useState(null);
  const [moneyExchangeTransactions, setMoneyExchangeTransactions] = useState([]);
  const [exchangeFromDate, setExchangeFromDate] = useState('');
  const [exchangeToDate, setExchangeToDate] = useState('');
  const [exchangeSortByAdminAsc, setExchangeSortByAdminAsc] = useState(null); // null = no sort, true = asc, false = desc
  const [exchangeSelectedAdmin, setExchangeSelectedAdmin] = useState('all');
  const [exchangeModeFilter, setExchangeModeFilter] = useState('all');

  // Build unique admin list from fetched money exchange transactions
  const exchangeAdmins = (() => {
    const map = new Map();
    (moneyExchangeTransactions || []).forEach(t => {
      const id = t.sender?._id || t.sender?.phone || '';
      const name = t.sender?.name || t.sender?.phone || id;
      if (id && !map.has(id)) map.set(id, { id, name });
    });
    return Array.from(map.values());
  })();

  const fetchMyCommission = async () => {
    try {
      const { data } = await adminAPI.getMyAdminCommission();
      console.log('Commission response:', data);
      const val = Number(data?.totalAdminCommission ?? data?.totalAdminCashOut);
      console.log('Parsed commission value:', val);
      setMyCashedOut(isNaN(val) ? 0 : val);
    } catch (e) {
      console.error('Failed to load my admin commission', e);
      setMyCashedOut(0);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await adminAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMoneyExchangeTransactions = async () => {
      try {
        const { data } = await adminAPI.getAllTransactions();
        // Filter for money_exchange transactions and get the latest 5
        const exchangeTransactions = data.filter(t => t.type === 'money_exchange').slice(0, 5);
        setMoneyExchangeTransactions(exchangeTransactions);
      } catch (error) {
        console.error('Failed to fetch money exchange transactions:', error);
      }
    };

    fetchStats();
    fetchMoneyExchangeTransactions();
    fetchMyCommission();

    // fetch admin's assigned state commission percent
    (async () => {
      try {
        const statesRes = await adminAPI.getStateSettings();
        const states = statesRes.data.states || [];
        const myStateId = user?.state;
        if (myStateId) {
          const found = states.find(s => s._id === myStateId || String(s._id) === String(myStateId));
          if (found) setAdminStateCommission(Number(found.commissionPercent || 0));
          else setAdminStateCommission(null);
        } else {
          setAdminStateCommission(null);
        }
      } catch (err) {
        console.error('Failed to load state settings', err);
        setAdminStateCommission(null);
      }
    })();

    // Listen for commission refresh events
    const handleRefreshCommission = () => {
      fetchMyCommission();
    };
    window.addEventListener('mpay:refresh-admin-commission', handleRefreshCommission);
    
    return () => {
      window.removeEventListener('mpay:refresh-admin-commission', handleRefreshCommission);
    };
  }, []);

  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const { data } = await adminAPI.getCommission();
        setCommission(data);
      } catch (err) {
        console.error('Failed to load commission settings', err);
      }
    };
    fetchCommission();
  }, []);

  const filteredMoneyExchangeTransactions = moneyExchangeTransactions.filter(t => {
    const txDate = new Date(t.createdAt);
    const from = exchangeFromDate ? new Date(exchangeFromDate) : null;
    const to = exchangeToDate ? new Date(exchangeToDate) : null;
    if (from && txDate < from) return false;
    if (to) {
      const toDateEnd = new Date(to);
      toDateEnd.setHours(23, 59, 59, 999);
      if (txDate > toDateEnd) return false;
    }
    // filter by selected admin if any
    if (exchangeSelectedAdmin && exchangeSelectedAdmin !== 'all') {
      const senderId = t.sender?._id || t.sender?.phone || '';
      if (String(senderId) !== String(exchangeSelectedAdmin)) return false;
    }
    // filter by mode if selected
    if (exchangeModeFilter && exchangeModeFilter !== 'all') {
      const exchangeInfo = t.description ? t.description.split(': ')[1] : '';
      const parts = exchangeInfo ? exchangeInfo.split(' (') : ['',''];
      const modeStr = (parts[1] || '').replace(')', '').toLowerCase();
      if (!modeStr || modeStr !== exchangeModeFilter) return false;
    }
    return true;
  });

  // Sort by admin name if requested
  const sortedMoneyExchangeTransactions = (() => {
    if (exchangeSortByAdminAsc === null) return filteredMoneyExchangeTransactions;
    const copy = [...filteredMoneyExchangeTransactions];
    copy.sort((a, b) => {
      const nameA = a.sender?.name || a.sender?.phone || '';
      const nameB = b.sender?.name || b.sender?.phone || '';
      if (!nameA && !nameB) return 0;
      if (!nameA) return exchangeSortByAdminAsc ? -1 : 1;
      if (!nameB) return exchangeSortByAdminAsc ? 1 : -1;
      return exchangeSortByAdminAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    return copy;
  })();

  const chartData = {
    labels: ['Users', 'Agents', 'Admins'],
    datasets: [
      {
        label: 'User Distribution',
        data: [
          stats?.usersByRole?.find(r => r._id === 'user')?.count || 0,
          stats?.usersByRole?.find(r => r._id === 'agent')?.count || 0,
          stats?.usersByRole?.find(r => r._id === 'admin')?.count || 0
        ],
        backgroundColor: ['#2563eb', '#10b981', '#f59e0b']
      }
    ]
  };

  const transactionChart = {
    labels: ['Completed', 'Pending', 'Failed'],
    datasets: [
      {
        label: 'Transactions',
        data: [
          stats?.completedTransactions || 0,
          stats?.pendingTransactions || 0,
          (stats?.totalTransactions || 0) - (stats?.completedTransactions || 0) - (stats?.pendingTransactions || 0)
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
      }
    ]
  };

  

  return (
    <>
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-logo" aria-hidden>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="#10B981"/>
              <path d="M17 28c1.5 1.5 4 2 6 2s4.5-.5 6-2v-2c-1.5 1-3.5 1.5-6 1.5s-4.5-.5-6-1.5V28z" fill="#fff" opacity="0.95"/>
              <path d="M24 14c-3 0-5 2-5 5h2c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3c-3 0-6 1-6 4v1h6v-2h-4v-1c0-1.2 2-2 4-2s6-1 6-5-4-7-7-7z" fill="#fff"/>
            </svg>
          </div>
          <div className="brand-text">
            <h1>MoneyPay Admin Dashboard</h1>
            <p className="text-muted">Monitor your MoneyPay system and manage operations</p>
            {user?.currentLocation && (
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                📍 {user.currentLocation.city}, {user.currentLocation.country}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid grid-3">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Total Users</p>
            <h3 className="stat-value">{stats?.totalUsers || 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <p className="stat-label">Total Transactions</p>
            <h3 className="stat-value">{stats?.totalTransactions || 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">Total Volume</p>
            <h3 className="stat-value">SSP {(Number(stats?.totalVolume) || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <p className="stat-label">Completed</p>
            <h3 className="stat-value">{stats?.completedTransactions || 0}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <p className="stat-label">All Admins Cashed Out</p>
            <h3 className="stat-value">SSP {(Number(stats?.totalAdminCashOut) || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👛</div>
          <div className="stat-content">
            <p className="stat-label">Admin Commission Cash</p>
            <h3 className="stat-value">SSP {(myCashedOut !== null ? Number(myCashedOut) : 0).toFixed(2)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏦</div>
          <div className="stat-content">
            <p className="stat-label">Company Benefits</p>
            <h3 className="stat-value">SSP {(Number(stats?.companyBenefits) || 0).toFixed(2)}</h3>
          </div>
        </div>
      </div>
          <div className="charts-grid grid-2">
            <div className="card">
              <div className="card-header">
                <h3>User Distribution</h3>
              </div>
              <div className="card-body">
                {!loading && <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Transaction Status</h3>
              </div>
              <div className="card-body">
                {!loading && <Bar data={transactionChart} options={{ responsive: true, maintainAspectRatio: true }} />}
              </div>
            </div>
          </div>

          <div className="card mt-4">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3>💱 Recent Money Exchange Transactions</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="date"
              value={exchangeFromDate}
              onChange={(e) => setExchangeFromDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }}
              title="From Date"
            />
            <input 
              type="date"
              value={exchangeToDate}
              onChange={(e) => setExchangeToDate(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }}
              title="To Date"
            />
            <select
              value={exchangeModeFilter}
              onChange={(e) => setExchangeModeFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }}
              title="Filter by Mode"
            >
              <option value="all">All Modes</option>
              <option value="buying">Buying</option>
              <option value="selling">Selling</option>
            </select>
            <select
              value={exchangeSelectedAdmin}
              onChange={(e) => setExchangeSelectedAdmin(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }}
              title="Filter by Admin"
            >
              <option value="all">All Admins</option>
              {exchangeAdmins.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {(exchangeFromDate || exchangeToDate) && (
              <button
                onClick={() => { setExchangeFromDate(''); setExchangeToDate(''); }}
                style={{
                  padding: '6px 12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          {sortedMoneyExchangeTransactions.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Converted</th>
                    <th>Mode</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => setExchangeSortByAdminAsc(prev => prev === null ? true : (prev ? false : null))}>
                      Admin{exchangeSortByAdminAsc === null ? '' : (exchangeSortByAdminAsc ? ' ▲' : ' ▼')}
                    </th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMoneyExchangeTransactions.map((transaction) => {
                    const exchangeInfo = transaction.description ? transaction.description.split(': ')[1] : '';
                    const [amounts, mode] = exchangeInfo ? exchangeInfo.split(' (') : ['', ''];
                    const [fromAmount, toAmount] = amounts ? amounts.split(' → ') : ['', ''];
                    return (
                      <tr key={transaction._id}>
                        <td>
                          <span style={{ fontWeight: 600, color: '#0369a1' }}>
                            {transaction.currencyCode}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#166534' }}>
                            {transaction.currencySymbol || 'N/A'}
                          </span>
                        </td>
                        <td>{fromAmount || transaction.amount}</td>
                        <td>{toAmount || '-'}</td>
                        <td>
                          <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
                            {mode ? mode.replace(')', '') : '-'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px' }}>
                            {transaction.sender?.name || transaction.sender?.phone || 'Admin'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(transaction.createdAt).toLocaleDateString()} {new Date(transaction.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">
              {moneyExchangeTransactions.length === 0 ? 'No money exchange transactions yet' : 'No transactions match the selected date range'}
            </p>
          )}
        </div>
      </div>

        <div className="card mt-4">
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="actions-grid">
            <a href="/admin/users" className="action-card">
              <div className="action-icon">👥</div>
              <h4>Manage Users</h4>
              <p>View and manage users</p>
            </a>
            <a href="/admin/transactions" className="action-card">
              <div className="action-icon">💳</div>
              <h4>View Transactions</h4>
              <p>Monitor all transactions</p>
            </a>
            <a href="/admin/notifications" className="action-card">
              <div className="action-icon">🔔</div>
              <h4>Send Notifications</h4>
              <p>Notify users</p>
            </a>
            <a href="/admin/tiered-commission" className="action-card">
              <div className="action-icon">💰</div>
              <h4>Tiered Commission</h4>
              <p>Manage send-money commission tiers</p>
            </a>
            <a href="/admin/reports" className="action-card">
              <div className="action-icon">📈</div>
              <h4>Reports</h4>
              <p>View detailed reports</p>
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
