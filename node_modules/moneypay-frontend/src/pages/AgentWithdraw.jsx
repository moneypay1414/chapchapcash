import { useState, useEffect } from 'react';
import { useAuthStore } from '../context/store';
import Toast from '../components/Toast';
import Footer from '../components/Footer';
import { transactionAPI, withdrawalAPI } from '../utils/api';
import '../styles/send-money.css';

export default function AgentWithdraw() {
  const user = useAuthStore((state) => state.user);
  const suspended = !!user?.isSuspended;
  const [userPhone, setUserPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  

  // Search user by phone
  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (suspended) {
      setToastMessage('Your account is suspended. You cannot perform transactions.');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (!userPhone.trim()) {
      setToastMessage('Please enter a user phone number');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setSearching(true);
    try {
      const response = await transactionAPI.getUserInfo(userPhone);
      if (response.data.user) {
        setUserInfo(response.data.user);
        setToastMessage('User found successfully');
        setToastType('success');
        setShowToast(true);
      } else {
        setUserInfo(null);
        setToastMessage('User not found');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setUserInfo(null);
      setToastMessage(error.response?.data?.message || 'Failed to search user');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSearching(false);
    }
  };

  // Handle withdrawal request submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (suspended) {
      setToastMessage('Your account is suspended. You cannot perform transactions.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!userInfo) {
      setToastMessage('Please search and select a user first');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setToastMessage('Please enter a valid amount');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const response = await withdrawalAPI.requestWithdrawal({
        userPhone: userInfo.phoneNumber,
        amount: parseFloat(amount)
      });

      setToastMessage('Withdrawal request sent successfully. Waiting for user approval.');
      setToastType('success');
      setShowToast(true);

      // Clear form
      setUserPhone('');
      setAmount('');
      setUserInfo(null);

      setTimeout(() => {
        // Optional: Navigate to transactions or pending requests
      }, 2000);
    } catch (error) {
      setToastMessage(error.response?.data?.message || 'Failed to send withdrawal request');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = parseFloat(amount) || 0;

  return (
    <>
    <div className="send-money-container">
      {suspended && <div className="alert alert-danger">Your account is suspended. You cannot perform transactions.</div>}
      <div className="send-money-card">
        <h2>Pull Money from User</h2>
        <p className="card-subtitle">Search for a user and pull funds (user approval required)</p>

        {/* User Search Section */}
        <div className="search-section">
            <h3>Find User</h3>
          <form onSubmit={handleSearchUser} className="search-form">
            <div className="form-group">
              <label htmlFor="userPhone">User Phone Number</label>
              <input
                id="userPhone"
                type="text"
                placeholder="Enter user phone number"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                disabled={searching}
              />
            </div>
            <button type="submit" disabled={searching || !userPhone.trim()} className="btn-search-user">
              {searching ? 'Searching...' : 'Search User'}
            </button>
          </form>
        </div>

        {/* User Info Display */}
        {userInfo && (
          <div className="user-info-section">
            <h3>User Information</h3>
            <div className="user-info-card">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{userInfo.fullName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{userInfo.phoneNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Balance:</span>
                <span className="info-value balance">SSP {(parseFloat(userInfo?.balance) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Request Form */}
        {userInfo && (
            <form onSubmit={handleSubmit} className="send-money-form">
            <div className="form-group">
              <label htmlFor="amount">Amount to Request</label>
              <input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                disabled={loading}
              />
            </div>

            {/* Commission Breakdown */}
            <div className="commission-breakdown">
              <h4>Commission Breakdown</h4>
              <div className="breakdown-row">
                <span>Withdrawal Amount:</span>
                <span>SSP {totalAmount.toFixed(2)}</span>
              </div>
              {/* Agent/Company commission rows removed per request */}
              <div className="breakdown-row total">
                <span>Withdrawal Amount requested:</span>
                <span>SSP {totalAmount.toFixed(2)}</span>
              </div>
              {/* "You Receive" row removed as requested */}
            </div>

            <button type="submit" disabled={loading || !amount} className="btn-send-pull-request">
              {loading ? 'Sending Pull Request...' : 'Send Pull Request'}
            </button>
          </form>
        )}

        {!userInfo && userPhone && !searching && (
          <div className="empty-state">
            <p>Search for a user to proceed with withdrawal request</p>
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
