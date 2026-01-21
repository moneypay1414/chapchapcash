import { useState } from 'react';
import { useAuthStore } from '../context/store';
import { transactionAPI } from '../utils/api';
import QRCode from 'qrcode.react';
import Footer from '../components/Footer';
import '../styles/send-money.css';

export default function SendMoney() {
  const user = useAuthStore((state) => state.user);
  const suspended = !!user?.isSuspended;
  const [method, setMethod] = useState('number'); // 'number' or 'qr'
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleSendMoney = async (e) => {
    e.preventDefault();
    if (suspended) {
      setError('Your account is suspended. You cannot perform transactions.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await transactionAPI.sendMoney({
        recipientPhone,
        amount: parseFloat(amount),
        description
      });
      setSuccess(`Money sent successfully! Transaction ID: ${data.transaction.transactionId}`);
      setRecipientPhone('');
      setAmount('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send money');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="page-container">
      <div className="page-header">
        <h1>Send Money</h1>
        <p>Transfer money to another user's phone number</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Choose Method</h3>
          </div>
          <div className="card-body">
            <div className="method-tabs">
              <button
                className={`method-tab ${method === 'number' ? 'active' : ''}`}
                onClick={() => setMethod('number')}
              >
                📱 Phone Number
              </button>
              <button
                className={`method-tab ${method === 'qr' ? 'active' : ''}`}
                onClick={() => setMethod('qr')}
              >
                📷 QR Code
              </button>
            </div>

            {method === 'number' ? (
              <form onSubmit={handleSendMoney} className="send-form">
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {suspended && (
                  <div className="alert alert-danger">Your account is suspended and cannot perform transactions.</div>
                )}
                <div className="form-group">
                  <label htmlFor="send-phone">Recipient Phone Number</label>
                  <input
                    id="send-phone"
                    name="recipient-phone"
                    type="tel"
                    autoComplete="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    required
                    placeholder="+211 123 456 789"
                    disabled={suspended}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="send-amount">Amount (SSP)</label>
                  <input
                    id="send-amount"
                    name="amount"
                    type="number"
                    autoComplete="off"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="send-description">Description (optional)</label>
                  <textarea
                    id="send-description"
                    name="description"
                    autoComplete="off"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this transfer for?"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || suspended}>
                  {loading ? 'Sending...' : suspended ? 'Account Suspended' : 'Send Money'}
                </button>
              </form>
            ) : (
              <div className="qr-section">
                <p className="text-center mb-3">Your QR Code for receiving payments</p>
                <div className="qr-code-container">
                  <QRCode
                    value={JSON.stringify({
                      type: 'transfer',
                      recipient: '+211 (Your phone)',
                      timestamp: Date.now()
                    })}
                    size={256}
                    level="H"
                  />
                </div>
                <p className="text-center text-small text-muted mt-3">
                  Share this code so others can send you money easily
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>📋 Instructions</h3>
          </div>
          <div className="card-body instructions">
            {method === 'number' ? (
              <ol>
                <li>Enter the recipient's phone number</li>
                <li>Enter the amount to send</li>
                <li>Add a description (optional)</li>
                <li>Review and confirm the transaction</li>
                <li>Money will be sent instantly</li>
                <li>Both parties will receive SMS confirmation</li>
              </ol>
            ) : (
              <ol>
                <li>Share your QR code with the sender</li>
                <li>They can scan it using their camera</li>
                <li>The transfer will be initiated automatically</li>
                <li>You'll receive instant notification</li>
                <li>Money will be added to your account</li>
                <li>No need to verify phone number</li>
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
