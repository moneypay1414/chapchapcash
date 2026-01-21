import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { useAuthStore } from '../context/store';
import Toast from '../components/Toast';

export default function AdminStatePending() {
  const [pending, setPending] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('pending_first');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const user = useAuthStore((s) => s.user);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getPendingStateSends();
      setPending(data.pending || []);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Failed to load pending transfers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleReceive = async (txId) => {
    if (!window.confirm('Mark this transfer as received?')) return;
    setActionLoading(txId);
    try {
      const { data } = await adminAPI.receiveStateSend(txId);
      setToast({ type: 'success', message: data.message || 'Marked received' });
      // update local state to mark as received (keep the row visible)
      setPending((prev) => prev.map(p => p._id === txId ? { ...p, status: 'completed' } : p));
      // notify dashboard to refresh commission and balances
      window.dispatchEvent(new CustomEvent('mpay:refresh-admin-commission'));
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to mark received' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (txId) => {
    if (!window.confirm('Cancel this pending transfer and refund sender?')) return;
    setActionLoading(txId);
    try {
      const { data } = await adminAPI.cancelStateSend(txId);
      setToast({ type: 'success', message: data.message || 'Cancelled' });
      // update local state to mark as cancelled (keep the row visible) and clear commission fields
      setPending((prev) => prev.map(p => p._id === txId ? { ...p, status: 'cancelled', commission: 0, companyCommission: 0 } : p));
      // notify any listeners to refresh
      window.dispatchEvent(new CustomEvent('mpay:refresh-admin-commission'));
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to cancel' });
    } finally {
      setActionLoading(null);
    }
  };

  // apply search and sort
  const filtered = pending
    .filter(tx => {
      if (!searchTerm) return true;
      const q = searchTerm.trim().toLowerCase();
      const tid = (tx.transactionId || tx._id || '').toString().toLowerCase();
      return tid.includes(q);
    })
    .sort((a, b) => {
      // normalize status values and support legacy values like 'received'
      const norm = (s) => (s || '').toString().toLowerCase();
      const isCompleted = (s) => {
        const v = norm(s);
        return v === 'completed' || v === 'received' || v === 'received_by_admin';
      };
      const isPending = (s) => norm(s) === 'pending';
      const isCancelled = (s) => norm(s) === 'cancelled';

      const rank = (tx, order) => {
        if (order === 'pending_first') return isPending(tx.status) ? 0 : 1;
        if (order === 'received_first') return isCompleted(tx.status) ? 0 : 1;
        if (order === 'cancelled_first') return isCancelled(tx.status) ? 0 : 1;
        // default to received_first behavior
        return isCompleted(tx.status) ? 0 : 1;
      };

      const ra = rank(a, sortOrder);
      const rb = rank(b, sortOrder);
      if (ra !== rb) return ra - rb;

      // tie-break: newest first by createdAt if available, else by _id
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : null;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : null;
      if (dateA !== null && dateB !== null) return dateB - dateA;
      // fallback to string compare of _id (ObjectId roughly increases over time)
      return String(b._id).localeCompare(String(a._id));
    });

  return (
    <div style={{paddingTop: 24, paddingBottom: 24}}>
      <h2>Pending Send By State</h2>
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:24, paddingTop: 16}}>
        <input
          placeholder="Search by transaction id"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{padding:8, borderRadius:6, border:'1px solid #ddd', minWidth:240}}
        />
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{padding:8,borderRadius:6}}>
          <option value="pending_first">Pending first</option>
          <option value="received_first">Received first</option>
          <option value="cancelled_first">Cancelled first</option>
        </select>
      </div>
      {loading ? <div>Loading...</div> : (
        <div style={{overflowX: 'auto'}}>
          {filtered.length === 0 ? <div>No pending transfers</div> : (
            <table className="table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Receiver Gets</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx._id}>
                    <td style={{whiteSpace: 'nowrap'}}>{tx.transactionId || tx._id}</td>
                    <td>{tx.sender?.name || tx.sender} {tx.sender?.phone ? `(${tx.sender.phone})` : ''}</td>
                    <td>{tx.receiver?.name || tx.receiver} {tx.receiver?.phone ? `(${tx.receiver.phone})` : ''}</td>
                    <td>{Number(tx.amount).toFixed(2)}</td>
                    <td>{tx.currencyCode || 'SSP'}</td>
                    <td>{Number(tx.receiverCredit || tx.amount).toFixed(2)}</td>
                    <td>{Number(tx.commission || 0).toFixed(2)}</td>
                    <td>{tx.status === 'completed' ? 'Received' : tx.status === 'cancelled' ? 'Cancelled' : 'Pending'}</td>
                    <td>
                      {/* existing action cell (receive/cancel/labels) */}
                      {(() => {
                        const isReceiver = String(user?._id) === String(tx.receiver?._id || tx.receiver);
                        const isSender = String(user?._id) === String(tx.sender?._id || tx.sender);

                        const IconButton = ({ children, loading, ...props }) => (
                          <button 
                            className="icon-btn" 
                            {...props} 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              padding: 0,
                              background: 'none',
                              border: 'none',
                              cursor: props.disabled ? 'not-allowed' : 'pointer',
                              opacity: props.disabled ? 0.5 : 1,
                              color: '#2563eb'
                            }}
                          >
                            {loading ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2" />
                                <path d="M22 12c0-5.52-4.48-10-10-10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                              </svg>
                            ) : children}
                          </button>
                        );

                        if (isReceiver) {
                          if (tx.status === 'completed') {
                            return <span style={{color: 'green', fontWeight: 600}}>Received</span>;
                          }
                          if (tx.status === 'cancelled') {
                            return <span style={{color: '#777'}}>Cancelled</span>;
                          }
                          // only allow receive action for pending transactions
                          return (
                            <IconButton 
                              onClick={() => handleReceive(tx._id)} 
                              disabled={actionLoading === tx._id}
                              loading={actionLoading === tx._id}
                              title="Mark Received" 
                              aria-label="Mark Received"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </IconButton>
                          );
                        }

                        if (isSender) {
                          if (tx.status === 'completed') {
                            return <span style={{color: 'green', fontWeight: 600}}>Received</span>;
                          }
                          if (tx.status === 'cancelled') {
                            return <span style={{color: '#777'}}>Cancelled</span>;
                          }
                          // only allow cancel action for pending transactions
                          return (
                            <IconButton 
                              onClick={() => handleCancel(tx._id)} 
                              disabled={actionLoading === tx._id}
                              loading={actionLoading === tx._id}
                              title="Cancel" 
                              aria-label="Cancel"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4Z" fill="currentColor" />
                              </svg>
                            </IconButton>
                          );
                        }

                        if (tx.status === 'cancelled') return <span style={{color: '#777'}}>Cancelled</span>;
                        return <span>{tx.status === 'completed' ? 'Received' : 'Pending'}</span>;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
