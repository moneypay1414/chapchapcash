import { useState } from 'react';
import { notificationAPI } from '../utils/api';
import Footer from '../components/Footer';
import '../styles/admin-notifications.css';

export default function AdminNotifications() {
  const [notificationType, setNotificationType] = useState('all'); // 'all' or 'user'
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [type, setType] = useState('system');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendToAll = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await notificationAPI.sendToAll({ title, message, type });
      setSuccess(data.message);
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await notificationAPI.sendToUser({ userId, title, message, type });
      setSuccess('Notification sent successfully');
      setTitle('');
      setMessage('');
      setUserId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="admin-page">
      <div className="page-header">
        <h1>Send Notifications</h1>
        <p>Communicate with users via notifications and SMS</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Notification Options</h3>
          </div>
          <div className="card-body">
            <div className="notification-tabs">
              <button
                className={`notification-tab ${notificationType === 'all' ? 'active' : ''}`}
                onClick={() => setNotificationType('all')}
              >
                📢 All Users
              </button>
              <button
                className={`notification-tab ${notificationType === 'user' ? 'active' : ''}`}
                onClick={() => setNotificationType('user')}
              >
                👤 Individual User
              </button>
            </div>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {success && <div className="alert alert-success mt-3">{success}</div>}

            {notificationType === 'all' ? (
              <form onSubmit={handleSendToAll} className="notification-form">
                <div className="form-group">
                  <label htmlFor="notif-title-all">Title</label>
                  <input
                    id="notif-title-all"
                    name="title-all"
                    type="text"
                    autoComplete="off"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Notification title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notif-msg-all">Message</label>
                  <textarea
                    id="notif-msg-all"
                    name="message-all"
                    autoComplete="off"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Your message here..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type-all">Type</label>
                  <select id="type-all" name="type-all" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="system">System</option>
                    <option value="alert">Alert</option>
                    <option value="offer">Offer</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? 'Sending...' : 'Send to All Users'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSendToUser} className="notification-form">
                <div className="form-group">
                  <label htmlFor="user-id">User ID</label>
                  <input
                    id="user-id"
                    name="user-id"
                    type="text"
                    autoComplete="off"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    placeholder="Enter user ID"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notif-title-user">Title</label>
                  <input
                    id="notif-title-user"
                    name="title-user"
                    type="text"
                    autoComplete="off"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Notification title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notif-msg-user">Message</label>
                  <textarea
                    id="notif-msg-user"
                    name="message-user"
                    autoComplete="off"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Your message here..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type-user">Type</label>
                  <select id="type-user" name="type-user" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="system">System</option>
                    <option value="alert">Alert</option>
                    <option value="transaction">Transaction</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? 'Sending...' : 'Send to User'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>📝 Tips</h3>
          </div>
          <div className="card-body tips">
            <ul>
              <li><strong>Keep it short:</strong> Messages should be concise</li>
              <li><strong>Be clear:</strong> Users should understand immediately</li>
              <li><strong>Include action:</strong> Tell users what to do</li>
              <li><strong>Test first:</strong> Send to individual before bulk sending</li>
              <li><strong>SMS included:</strong> All notifications are sent via SMS too</li>
              <li><strong>Best time:</strong> Send during business hours for better engagement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
