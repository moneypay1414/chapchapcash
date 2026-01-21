import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import PrintReceipt from '../components/PrintReceipt';
import { transactionAPI } from '../utils/api';
import { generateTransactionDocument } from '../utils/pdf';
import { useAuthStore } from '../context/store';
import '../styles/transactions.css';

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const transactionIdParam = searchParams.get('id');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchId, setSearchId] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await transactionAPI.getTransactions();
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
    .filter(t => {
      // If viewing specific transaction by ID, show only that one
      if (transactionIdParam) {
        return t.id === transactionIdParam;
      }
      return !searchId || t.transactionId.toLowerCase().includes(searchId.toLowerCase());
    });

  const getTypeIcon = (type) => {
    const icons = {
      transfer: '📤',
      withdrawal: '💵',
      topup: '📥',
      agent_deposit: '🏪'
    };
    return icons[type] || '💳';
  };

  const getTransactionTitle = (tx) => {
    const isOutgoing = tx.senderId === user?.id;
    const counterparty = isOutgoing ? tx.receiver : tx.sender;
    const counterpartyName = counterparty?.name || counterparty?.phone || 'Unknown';

    switch (tx.type) {
      case 'transfer':
        return isOutgoing ? `Sent to ${counterpartyName}` : `Received from ${counterpartyName}`;
      case 'withdrawal':
        return 'Withdrawal Request';
      case 'topup':
        return 'Account Topup';
      case 'agent_deposit':
        return isOutgoing ? `Deposit to ${counterpartyName}` : `Deposit from ${counterpartyName}`;
      default:
        return tx.type;
    }
  };

  const handleDownload = (tx) => {
    generateTransactionDocument(tx);
  };

  return (
    <>
    <div className="page-container">
      <div className="page-header">
        <h1>Transaction History</h1>
        <p>View all your transactions</p>
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <h3>Transactions {filteredTransactions.length === 1 ? '(Transaction Details)' : `(${filteredTransactions.length})`}</h3>
          {!transactionIdParam && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by Transaction ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  minWidth: '200px'
                }}
              />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Transactions</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <p className="text-center">Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-muted">No transactions found</p>
          ) : (
            <div className="transactions-list">
              {filteredTransactions.map(tx => (
                <div key={tx.id} className="transaction-item">
                  <div className="transaction-icon">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="transaction-details">
                    <div>
                      <h4 className="transaction-title">
                        {getTransactionTitle(tx)}
                      </h4>
                      <p className="transaction-id">TX: {tx.transactionId}</p>
                      {(tx.sender || tx.receiver) && (
                        <p className="transaction-location" style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                          📍 {tx.sender ? `From: ${tx.sender.name || tx.sender.phone}` : ''}
                          {tx.sender && tx.receiver && ' | '}
                          {tx.receiver ? `To: ${tx.receiver.name || tx.receiver.phone}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="transaction-date">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="transaction-amount">
                    SSP {(parseFloat(tx.amount) || 0).toFixed(2)}
                  </div>
                  <div className="transaction-status">
                    <span className={`badge badge-${
                      tx.status === 'completed' ? 'success' :
                      tx.status === 'pending' ? 'warning' :
                      'danger'
                    }`}>
                      {tx.status}
                    </span>
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
                        marginLeft: '8px'
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
                        borderRadius: '4px',
                        marginLeft: '4px'
                      }}
                    >
                      🖨️
                    </button>
                  </div>
                </div>
              ))}
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
