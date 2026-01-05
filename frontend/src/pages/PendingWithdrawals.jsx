import { useState, useEffect } from 'react';
import { useAuthStore } from '../context/store';
import Toast from '../components/Toast';
import Footer from '../components/Footer';
import { withdrawalAPI } from '../utils/api';
import '../styles/pending-withdrawals.css';

export default function PendingWithdrawals() {
  const user = useAuthStore((state) => state.user);
  const suspended = !!user?.isSuspended;
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await withdrawalAPI.getPendingRequests();
      setPendingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      setToastMessage('Failed to load pending requests');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    setProcessingAction('approve');
    try {
      // Use admin endpoint if current user is an admin
      if (user?.role === 'admin') {
        await withdrawalAPI.approveAdminWithdrawalRequest({ requestId });
      } else {
        await withdrawalAPI.approveRequest({ requestId });
      }
      setToastMessage('Withdrawal request approved successfully');
      setToastType('success');
      setShowToast(true);
      fetchPendingRequests();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to approve request';
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
      // If request was already processed by someone else, refresh list
      if (error.response?.status === 409) fetchPendingRequests();
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    setProcessingAction('reject');
    try {
      // Use admin endpoint if current user is an admin
      if (user?.role === 'admin') {
        await withdrawalAPI.rejectAdminWithdrawalRequest({ requestId });
      } else {
        await withdrawalAPI.rejectRequest({ requestId });
      }
      setToastMessage('Withdrawal request rejected');
      setToastType('success');
      setShowToast(true);
      fetchPendingRequests();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reject request';
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
      if (error.response?.status === 409) fetchPendingRequests();
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading">Loading pending requests...</div>
      </div>
    );
  }

  return (
    <>
    <div className="pending-withdrawals-page">
      <div className="page-header-section">
        <div className="header-content">
          <h1>💰 Pending Pull Requests</h1>
          <p>Review and manage withdrawal requests from agents</p>
        </div>
      </div>

      <div className="page-body">
        {pendingRequests.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-icon">📭</div>
            <h3>No Pending Requests</h3>
            <p>All withdrawal requests have been processed</p>
          </div>
        ) : (
          <div className="requests-grid">
            {pendingRequests.map((request, index) => (
              <div key={request.id} className="request-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="card-header-section">
                  <div className="agent-info">
                    <div className="agent-avatar">🧑</div>
                    <div className="agent-details">
                      <h3 className="agent-name">{request.agent?.name || request.agentId?.name || 'Unknown Agent'}</h3>
                      <p className="agent-phone">{request.agent?.phone || request.agentId?.phone}</p>
                    </div>
                  </div>
                  <div className="status-badge pending">Pending</div>
                </div>

                <div className="amount-display">
                  <div className="amount-label">Withdrawal Amount</div>
                  <div className="amount-value">SSP {(parseFloat(request.amount) || 0).toFixed(2)}</div>
                </div>

                <div className="breakdown-section">
                  <div className="breakdown-item">
                    <span className="label">Withdrawal Amount</span>
                    <span className="value">SSP {(parseFloat(request.amount) || 0).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Agent Commission ({request.agentCommissionPercent || 0}%)</span>
                    <span className="value commission">SSP {(parseFloat(request.agentCommission) || 0).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Company Commission ({request.companyCommissionPercent || 0}%)</span>
                    <span className="value commission">SSP {(parseFloat(request.companyCommission) || 0).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Total Commission Fee</span>
                    <span className="value commission-fee">SSP {((parseFloat(request.agentCommission) || 0) + (parseFloat(request.companyCommission) || 0)).toFixed(2)}</span>
                  </div>
                  <div className="breakdown-divider"></div>
                  <div className="breakdown-item total">
                    <span className="label">Total User Pays</span>
                    <span className="value">SSP {(parseFloat(request.amount) + (parseFloat(request.agentCommission) || 0) + (parseFloat(request.companyCommission) || 0)).toFixed(2)}</span>
                  </div>
                </div>

                <div className="request-timestamp">
                  📅 {new Date(request.createdAt).toLocaleDateString()} • {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="action-buttons">
                  <button
                    className="btn btn-approve-action"
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id && processingAction === 'approve' || suspended}
                  >
                    {processingId === request.id && processingAction === 'approve' ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">✓</span>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-reject-action"
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id && processingAction === 'reject' || suspended}
                  >
                    {processingId === request.id && processingAction === 'reject' ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">✕</span>
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
    <Footer />
    </>
  );
}
