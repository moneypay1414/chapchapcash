import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import Footer from '../components/Footer';
import PrintReceipt from '../components/PrintReceipt';
import { generateTransactionDocument } from '../utils/pdf';
import '../styles/admin-transactions.css';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await adminAPI.getAllTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = (filter === 'all'
    ? transactions
    : transactions.filter(t => t.status === filter))
    .filter(t => typeFilter === 'all' ? true : t.type === typeFilter)
    .filter(t => {
      const txDate = new Date(t.createdAt);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      if (from && txDate < from) return false;
      if (to) {
        const toDateEnd = new Date(to);
        toDateEnd.setHours(23, 59, 59, 999);
        if (txDate > toDateEnd) return false;
      }
      return true;
    })
    .filter(t => 
      t.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      t.sender?.phone?.includes(search) ||
      t.receiver?.phone?.includes(search)
    );

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      cancelled: 'badge-primary'
    };
    return badges[status] || 'badge-primary';
  };

  const handleDownload = (tx) => {
    generateTransactionDocument(tx);
  };

  return (
    <>
    <div className="admin-page">
      <div className="page-header">
        <h1>All Transactions</h1>
        <p>Monitor system-wide transactions</p>
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <h3>Transactions ({filteredTransactions.length})</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              type="text"
              placeholder="Search by ID or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-select"
              style={{ flex: 1, minWidth: '200px' }}
            />
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="filter-select"
              title="From Date"
            />
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="filter-select"
              title="To Date"
            />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="topup">Topup</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="money_exchange">Money Exchange</option>
              <option value="admin_push">Admin Push</option>
              <option value="admin_state_push">Admin State Push</option>
            </select>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); }}
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
                title="Clear date range"
              >
                ✕ Clear Dates
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <p className="text-center">Loading transactions...</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Locations</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => (
                    <tr key={tx._id}>
                      <td><code>{tx.transactionId}</code></td>
                      <td>{tx.sender?.phone}</td>
                      <td>{tx.receiver?.phone || '-'}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {tx.sender && <div>From: {tx.sender.name || tx.sender.phone}</div>}
                        {tx.receiver && <div>To: {tx.receiver.name || tx.receiver.phone}</div>}
                        {!tx.sender && !tx.receiver && '-'}
                      </td>
                      <td>
                        <span className="badge badge-primary">{tx.type}</span>
                      </td>
                      <td>SSP {(parseFloat(tx.amount) || 0).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleDownload(tx)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            marginRight: '4px'
                          }}
                          title="Download transaction"
                        >
                          ⬇️
                        </button>
                        <button
                          className="btn btn-sm"
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
