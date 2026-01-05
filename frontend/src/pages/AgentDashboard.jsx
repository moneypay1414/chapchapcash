import { useState, useEffect } from 'react';
import { useAuthStore } from '../context/store';
import PrintReceipt from '../components/PrintReceipt';
import { transactionAPI, withdrawalAPI } from '../utils/api';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import Footer from '../components/Footer';
import '../styles/dashboard.css';
import '../styles/agent-dashboard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

export default function AgentDashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await transactionAPI.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch agent stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        const { data } = await transactionAPI.getTransactions();
        setTransactions(data || []);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      }
    };

    fetchStats();
    fetchTransactions();

    // Refresh stats when the current user's balance updates via socket bridge
    const handleUserUpdated = (e) => {
      try {
        const updated = e?.detail;
        if (updated && updated._id === user?._id) {
          // re-fetch stats when this agent's balance changed
          fetchStats();
        }
      } catch (err) {
        console.error('Failed handling mpay:user-updated event', err);
      }
    };

    window.addEventListener('mpay:user-updated', handleUserUpdated);

    return () => {
      window.removeEventListener('mpay:user-updated', handleUserUpdated);
    };
  }, []);

  // Derived list: recent money received (transfers only where current user is receiver)
  const receivedList = transactions
    .filter((tx) => tx.receiver && tx.receiver._id && tx.receiver._id.toString() === user?._id?.toString() && tx.status === 'completed' && tx.type === 'transfer')
    .slice(0, 5);

  // Recent withdrawals involving this agent (either as receiver or sender)
  const recentWithdrawals = transactions
    .filter((tx) => (tx.type === 'user_withdraw' || tx.type === 'withdrawal') && (tx.sender?._id?.toString() === user?._id?.toString() || tx.receiver?._id?.toString() === user?._id?.toString()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Recent pulls (user_withdraw type only)
  const recentPulls = transactions
    .filter((tx) => tx.type === 'user_withdraw' && (tx.sender?._id?.toString() === user?._id?.toString() || tx.receiver?._id?.toString() === user?._id?.toString()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Recent pure withdrawals (withdraw type only, excluding user_withdraw)
  const pureWithdrawals = transactions
    .filter((tx) => tx.type === 'user_withdraw' && (tx.sender?._id?.toString() === user?._id?.toString() || tx.receiver?._id?.toString() === user?._id?.toString()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Agent cash out money (agent_cash_out_money type where current user is the sender)
  const adminCashOut = transactions
    .filter((tx) => tx.type === 'agent_cash_out_money' && tx.sender?._id?.toString() === user?._id?.toString())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Handled (SSP)',
        data: [2000, 3000, 2500, 4000],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const doughnutData = {
    labels: ['Transfers', 'Withdrawals', 'Fees'],
    datasets: [
      {
        data: [50, 40, 10],
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
          <h1>Welcome, Agent {user?.name}! 👋</h1>
          <p className="text-muted">Agent Dashboard — manage withdrawals and transactions</p>
          {user?.currentLocation && (
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
              📍 {user.currentLocation.city}, {user.currentLocation.country}
            </p>
          )}
          {user?.role === 'agent' && (
            <div style={{ marginTop: 8 }}>
              <span className={`badge ${user?.autoAdminCashout ? 'badge-success' : 'badge-secondary'}`}>
                Admin Cash-Out approval: {user?.autoAdminCashout ? 'On' : 'Off'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid grid-3">
        <div className="stat-card balance-card">
          <div className="stat-icon balance">💰</div>
          <div className="stat-content">
            <p className="stat-label">My Wallet</p>
            <h3 className="stat-value">SSP {Math.max(0, (user?.balance || 0) - (stats?.pendingAgentCommission || 0) - (stats?.pendingCompanyCommission || 0)).toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sent">📤</div>
          <div className="stat-content">
            <p className="stat-label">Money Sent</p>
            <h3 className="stat-value">SSP {(Number(stats?.transfersSentAmount) || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon received">📥</div>
          <div className="stat-content">
            <p className="stat-label">Withdrawn</p>
            <h3 className="stat-value">SSP {(Number(stats?.withdrawalsCompletedAmount) || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon commission">💎</div>
          <div className="stat-content">
            <p className="stat-label">Commission Earned</p>
            <h3 className="stat-value">SSP {(Number(stats?.commissionEarned) || 0).toFixed(2)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pulled">🤝</div>
          <div className="stat-content">
            <p className="stat-label">Pulled Money</p>
            <h3 className="stat-value">SSP {stats?.pullsReceivedAmount?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon received">📨</div>
          <div className="stat-content">
            <p className="stat-label">Money Received</p>
            <h3 className="stat-value">SSP {stats?.transfersReceivedAmount?.toFixed(2) || '0.00'}</h3>
          </div>
        </div>
      </div>

      <div className="charts-grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Activity</h3>
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
              <div style={{ maxHeight: '2000px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
            <a href="/agent/send-money" className="action-card">
              <div className="action-icon">📤</div>
              <h4>Send Money</h4>
              <p>Transfer to another user</p>
            </a>
            <a href="/agent/withdraw" className="action-card">
              <div className="action-icon">💵</div>
              <h4>Withdraw</h4>
              <p>Cash out to agent</p>
            </a>
            <a href="/agent/transactions" className="action-card">
              <div className="action-icon">📋</div>
              <h4>Transactions</h4>
              <p>View history</p>
            </a>
            <a href="/agent/profile" className="action-card">
              <div className="action-icon">👤</div>
              <h4>Profile</h4>
              <p>Manage account</p>
            </a>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>Recent Pulls</h3>
        </div>
        <div className="card-body">
          {recentPulls.length === 0 ? (
            <p className="text-muted">No recent pulls</p>
          ) : (
            <div className="table-responsive">
              <table className="withdrawals-table">
                <thead>
                  <tr>
                    <th>User/Agent</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Agent Comm</th>
                    <th>Company Comm</th>
                    <th>Status</th>
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPulls.map((w) => (
                    <tr key={w._id || w.id}>
                      <td>{w.type === 'user_withdraw' ? (w.sender?.name || w.sender?.phone || 'User') : (w.receiver?.name || w.receiver?.phone || 'Agent')}</td>
                      <td>{w.type === 'user_withdraw' ? 'Pulled from user' : 'Withdrawal'}</td>
                      <td>SSP {(parseFloat(w.amount) || 0).toFixed(2)}</td>
                      <td>SSP {((parseFloat(w.agentCommission) ?? parseFloat(w.commission) ?? 0)).toFixed(2)}</td>
                      <td>SSP {(parseFloat(w.companyCommission) ?? 0).toFixed(2)}</td>
                      <td><span className={`badge badge-${w.status === 'completed' ? 'success' : w.status === 'pending' ? 'warning' : 'danger'}`}>{w.status}</span></td>
                      <td>{new Date(w.createdAt).toLocaleString()}</td>
                      <td style={{ display: 'flex', gap: '4px' }}>
                        <a href={`/agent/transactions?id=${w._id}`} className="view-btn">View</a>
                        <button
                          onClick={() => setSelectedTransaction(w)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        >
                          🖨️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>Recent Withdrawals</h3>
        </div>
        <div className="card-body">
          {pureWithdrawals.length === 0 ? (
            <p className="text-muted">No recent withdrawals</p>
          ) : (
            <div className="table-responsive">
              <table className="withdrawals-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pureWithdrawals.map((w) => (
                    <tr key={w._id || w.id}>
                      <td>{w.sender?.name || w.sender?.phone || 'Agent'}</td>
                      <td>Withdrawal</td>
                      <td>SSP {(parseFloat(w.amount) || 0).toFixed(2)}</td>
                      <td><span className={`badge badge-${w.status === 'completed' ? 'success' : w.status === 'pending' ? 'warning' : 'danger'}`}>{w.status}</span></td>
                      <td>{new Date(w.createdAt).toLocaleString()}</td>
                      <td style={{ display: 'flex', gap: '4px' }}>
                        <a href={`/agent/transactions?id=${w._id}`} className="view-btn">View</a>
                        <button
                          onClick={() => setSelectedTransaction(w)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        >
                          🖨️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>Agent Cash Out Money</h3>
        </div>
        <div className="card-body">
          {adminCashOut.length === 0 ? (
            <p className="text-muted">No agent cash out transactions</p>
          ) : (
            <div className="table-responsive">
              <table className="withdrawals-table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Transaction ID</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminCashOut.map((w) => (
                    <tr key={w._id || w.id}>
                      <td>{w.receiver?.name || w.receiver?.phone || 'Admin'}</td>
                      <td>{w.transactionId || 'N/A'}</td>
                      <td>{w.description || 'No description'}</td>
                      <td>SSP {(parseFloat(w.amount) || 0).toFixed(2)}</td>
                      <td><span className={`badge badge-${w.status === 'completed' ? 'success' : w.status === 'pending' ? 'warning' : 'danger'}`}>{w.status}</span></td>
                      <td>{new Date(w.createdAt).toLocaleString()}</td>
                      <td style={{ display: 'flex', gap: '4px' }}>
                        <a href={`/agent/transactions?id=${w._id}`} className="view-btn">View</a>
                        <button
                          onClick={() => setSelectedTransaction(w)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        >
                          🖨️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>Recent Money Received</h3>
        </div>
        <div className="card-body">
          {receivedList.length === 0 ? (
            <p className="text-muted">No recent incoming transactions</p>
          ) : (
            <div className="table-responsive">
              <table className="received-table">
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date & Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedList.map((tx) => (
                    <tr key={tx._id}>
                      <td>{tx.sender?.name || tx.sender?.phone || 'Unknown'}</td>
                      <td>{tx.type === 'user_withdraw' ? 'Pulled from user' : 'Transfer'}</td>
                      <td>SSP {(parseFloat(tx.amount) || 0).toFixed(2)}</td>
                      <td>{new Date(tx.createdAt).toLocaleString()}</td>
                      <td style={{ display: 'flex', gap: '4px' }}>
                        <a href={`/agent/transactions?id=${tx._id}`} className="view-btn">View</a>
                        <button
                          onClick={() => setSelectedTransaction(tx)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        >
                          🖨️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
