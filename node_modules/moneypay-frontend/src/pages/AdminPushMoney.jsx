import { useState } from 'react';
import { adminAPI } from '../utils/api';
import Footer from '../components/Footer';
import '../styles/admin-push-money.css';

export default function AdminPushMoney() {
  const [fromPhone, setFromPhone] = useState('');
  const [toPhone, setToPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const amt = parseFloat(amount);
    if (!fromPhone || !toPhone || isNaN(amt) || amt <= 0) {
      setMessage({ type: 'error', text: 'Please provide valid phones and amount.' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await adminAPI.pushMoney({ fromPhone, toPhone, amount: amt });
      setMessage({ type: 'success', text: `Transfer complete (${data.transactionId})` });
      setFromPhone(''); setToPhone(''); setAmount('');
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Admin Push Money</h1>
        <p>Transfer funds from one user to another using phone numbers</p>
      </div>

      <div className="card">
        <div className="card-body">
          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="push-form">
            <label>From (phone)</label>
            <input value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} placeholder="e.g. +2519..." />

            <label>To (phone)</label>
            <input value={toPhone} onChange={(e) => setToPhone(e.target.value)} placeholder="e.g. +2519..." />

            <label>Amount (SSP)</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />

            <button className="btn btn-primary" disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
