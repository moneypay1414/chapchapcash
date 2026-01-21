import { useState, useEffect } from 'react';
import { useAuthStore } from '../context/store';
import { withdrawalAPI } from '../utils/api';
import Footer from '../components/Footer';
import '../styles/pending-withdrawals.css';

export default function PendingAdminRequests() {
  const user = useAuthStore((state) => state.user);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWithdrawalRequests = async () => {
      try {
        setLoading(true);
        const { data } = await withdrawalAPI.getAgentWithdrawalRequests();
        setWithdrawalRequests(data.requests || []);
      } catch (err) {
        console.error('Failed to fetch withdrawal requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalRequests();
  }, []);

  const handleApproveWithdrawal = async (requestId) => {
    setApprovingId(requestId);
    try {
      await withdrawalAPI.approveAdminWithdrawalRequest({ requestId });
      setWithdrawalRequests(withdrawalRequests.filter(r => r.id !== requestId));
      
      // Dispatch event to refresh agent dashboard stats
      window.dispatchEvent(new CustomEvent('mpay:withdrawal-approved'));
    } catch (err) {
      console.error('Failed to approve withdrawal:', err);
      alert(err.response?.data?.message || 'Failed to approve withdrawal');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectWithdrawal = async (requestId) => {
    setRejectingId(requestId);
    try {
      await withdrawalAPI.rejectAdminWithdrawalRequest({ requestId, reason: 'Rejected by agent' });
      
        // Dispatch event to refresh agent dashboard stats
        window.dispatchEvent(new CustomEvent('mpay:withdrawal-rejected'));
      setWithdrawalRequests(withdrawalRequests.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Failed to reject withdrawal:', err);
      alert(err.response?.data?.message || 'Failed to reject withdrawal');
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <>
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Pending Admin Withdrawal Requests</h1>
          <p>Approve or reject admin cash out requests from your agent account</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Admin Requests ({withdrawalRequests.length})</h3>
        </div>
        <div className="card-body">
          {loading ? (
            <p className="text-center text-muted">Loading requests...</p>
          ) : withdrawalRequests.length === 0 ? (
            <p className="text-muted text-center">No pending admin withdrawal requests</p>
          ) : (
            <div className="table-responsive">
              <table className="withdrawals-table">
                <thead>
                  <tr>
                    <th>Admin Name</th>
                    <th>Amount</th>
                    <th>Requested Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.user?.name || request.user?.phone || 'Unknown Admin'}</td>
                      <td>SSP {(parseFloat(request.amount) || 0).toFixed(2)}</td>
                      <td>{new Date(request.createdAt).toLocaleString()}</td>
                      <td>
                        <button
                          onClick={() => handleApproveWithdrawal(request.id)}
                          disabled={approvingId === request.id || rejectingId === request.id}
                          className="btn btn-sm btn-success"
                          style={{ marginRight: '0.5rem' }}
                        >
                          {approvingId === request.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectWithdrawal(request.id)}
                          disabled={approvingId === request.id || rejectingId === request.id}
                          className="btn btn-sm btn-danger"
                        >
                          {rejectingId === request.id ? 'Rejecting...' : 'Reject'}
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
    </div>
    <Footer />
    </>
  );
}
