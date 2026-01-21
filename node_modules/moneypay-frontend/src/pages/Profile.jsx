import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useAuthStore } from '../context/store';
import { authAPI } from '../utils/api';
import '../styles/profile.css';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const setTheme = useAuthStore((state) => state.setTheme);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    profileImage: '',
    autoAdminCashout: false,
    theme: 'light'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        idNumber: user.idNumber || '',
        profileImage: user.profileImage || '',
        autoAdminCashout: !!user.autoAdminCashout,
        theme: user.theme || 'light'
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
    try {
      // Update global auth store immediately so dashboard badge updates in real-time
      const store = useAuthStore.getState();
      if (store && store.user) {
        const updatedUser = { ...store.user, [name]: checked };
        store.updateUser(updatedUser);
      }
    } catch (err) {
      console.error('Failed to update auth store on toggle', err);
    }
  };

  const handleAutoAdminCashoutChange = async (e) => {
    const checked = e.target.checked;
    // optimistic update UI
    setFormData((prev) => ({ ...prev, autoAdminCashout: checked }));

    try {
      const { data } = await authAPI.updateProfile({ autoAdminCashout: checked });
      if (data) {
        useAuthStore.setState({ user: data });
      }

      const status = checked ? 'ON' : 'OFF';
      setToastMessage(`Admin Cash-Out approval: ${status}`);
      setToastType('success');
    } catch (err) {
      // revert UI on failure
      setFormData((prev) => ({ ...prev, autoAdminCashout: !checked }));
      setToastMessage(err.response?.data?.message || 'Failed to update setting');
      setToastType('error');
      console.error('Failed to update autoAdminCashout:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data } = await authAPI.updateProfile(formData);
      setMessage('Profile updated successfully!');
      
      // Show specific toast for Admin Cash-Out approval changes
      if (user?.role === 'agent' && typeof formData.autoAdminCashout !== 'undefined') {
        const status = formData.autoAdminCashout ? 'ON' : 'OFF';
        setToastMessage(`Admin Cash-Out approval: ${status}`);
        setToastType('success');
      }

      // Show toast for theme changes
      if (typeof formData.theme !== 'undefined' && formData.theme !== user?.theme) {
        const themeLabel = formData.theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
        setToastMessage(`Theme changed to ${themeLabel}`);
        setToastType('success');
      }
      
      // API returns updated user object - sync both store and form state
      if (data) {
        useAuthStore.setState({ user: data });
        if (data.theme) {
          setTheme(data.theme);
        }
        // Update form data with server response to ensure consistency
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          idNumber: data.idNumber || '',
          profileImage: data.profileImage || '',
          autoAdminCashout: !!data.autoAdminCashout,
          theme: data.theme || 'light'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = async (newTheme) => {
    try {
      const { data } = await authAPI.updateProfile({ theme: newTheme });
      if (data) {
        useAuthStore.setState({ user: data });
        if (data.theme) setTheme(data.theme);
        setFormData((prev) => ({ ...prev, theme: data.theme || newTheme }));
      }

      const themeLabel = newTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode';
      setToastMessage(`Theme changed to ${themeLabel}`);
      setToastType('success');
    } catch (err) {
      console.error('Failed to change theme:', err);
      setToastMessage('Failed to change theme');
      setToastType('error');
    }
  };

  return (
    <>
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 My Profile</h1>
        <p className="text-muted">Manage your account information</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="profile-grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Account Information</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled
                  className="input-disabled"
                />
                <small className="text-muted">Name cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="profile-email">Email Address</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled
                  className="input-disabled"
                />
                <small className="text-muted">Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="profile-phone">Phone Number</label>
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled
                  className="input-disabled"
                />
                <small className="text-muted">Phone cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="profile-id">ID Number</label>
                <input
                  id="profile-id"
                  name="idNumber"
                  type="text"
                  autoComplete="off"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your ID number"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Account Details</h3>
          </div>
          <div className="card-body profile-details">
            <div className="detail-item">
              <span className="detail-label">Account Type</span>
              <span className="detail-value badge badge-primary">{user?.role?.toUpperCase() || 'N/A'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Verification Status</span>
              <span className="detail-value">
                {user?.isVerified ? (
                  <span className="badge badge-success">✓ Verified</span>
                ) : (
                  <span className="badge badge-warning">Pending</span>
                )}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Account Status</span>
              <span className="detail-value">
                {user?.isSuspended ? (
                  <span className="badge badge-danger">Suspended</span>
                ) : (
                  <span className="badge badge-success">Active</span>
                )}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Current Balance</span>
              <span className="detail-value text-success font-weight-bold">SSP {(parseFloat(user?.balance) || 0).toFixed(2)}</span>
            </div>

            {user?.role === 'agent' && user?.agentId && (
              <div className="detail-item">
                <span className="detail-label">Agent ID</span>
                <span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px' }}>
                  {user.agentId}
                </span>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-label">Member Since</span>
              <span className="detail-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>⚙️ Account Settings</h3>
        </div>
        <div className="card-body">
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Change Password</h4>
                <p className="text-muted">Update your password regularly for security</p>
              </div>
              <a href="#" className="btn btn-outline">Change Password</a>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Security Settings</h4>
                <p className="text-muted">Manage your login activity and sessions</p>
              </div>
              <a href="#" className="btn btn-outline">View Sessions</a>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Privacy & Notifications</h4>
                <p className="text-muted">Control how you receive notifications</p>
              </div>
              <a href="#" className="btn btn-outline">Manage Preferences</a>
            </div>

            {user?.role === 'agent' && (
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Admin Cash-Out Approval</h4>
                  <p className="text-muted">When enabled, admins can cash out from your account without needing your approval.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="switch">
                    <input type="checkbox" name="autoAdminCashout" checked={formData.autoAdminCashout} onChange={handleAutoAdminCashoutChange} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            )}

            <div className="setting-item">
              <div className="setting-info">
                <h4>Display Mode</h4>
                <p className="text-muted">Choose between light and dark mode for your dashboard</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="switch" style={{ marginRight: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formData.theme === 'dark'}
                    onChange={async (e) => {
                      const newTheme = e.target.checked ? 'dark' : 'light';
                      setFormData((prev) => ({ ...prev, theme: newTheme }));
                      await handleThemeToggle(newTheme);
                    }}
                  />
                  <span className="slider"></span>
                </label>
                <span style={{ fontSize: '14px' }}>{formData.theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    <Toast 
      message={toastMessage} 
      type={toastType} 
      onClose={() => setToastMessage('')} 
    />
    </>
  );
}
