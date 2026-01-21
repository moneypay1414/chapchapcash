import { useEffect, useState } from 'react';
import { adminAPI, authAPI } from '../utils/api';
import { useAuthStore } from '../context/store';
import Toast from '../components/Toast';
import Footer from '../components/Footer';
import '../styles/withdraw.css';

export default function AdminSettings() {
  const user = useAuthStore((state) => state.user);
  const setTheme = useAuthStore((state) => state.setTheme);
  const [theme, setThemeLocal] = useState(user?.theme || 'light');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    // Settings page initialization if needed
  }, []);

  const handleThemeChange = async (newThemeOverride) => {
    try {
      const newTheme = typeof newThemeOverride !== 'undefined' ? newThemeOverride : theme;

      // Update backend using authAPI.updateProfile
      const { data } = await authAPI.updateProfile({ theme: newTheme });

      // Update store with returned user data
      if (data) {
        useAuthStore.setState({ user: data });
        setTheme(data.theme || newTheme);
        setThemeLocal(data.theme || newTheme);
      }

      // Show toast
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
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Settings</h1>
        <p>Configure system-wide settings</p>
      </div>

      <div className="card">
          <div className="card-header">
            <h3>⚙️ Display Settings</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>Display Mode</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-light)' }}>Choose between light and dark mode</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="switch" style={{ marginRight: '10px' }}>
                  <input
                    type="checkbox"
                    checked={theme === 'dark'}
                    onChange={async (e) => {
                      const newTheme = e.target.checked ? 'dark' : 'light';
                      setThemeLocal(newTheme);
                      await handleThemeChange(newTheme);
                    }}
                  />
                  <span className="slider"></span>
                </label>
                <span style={{ fontSize: '14px' }}>{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
              </div>
            </div>
          </div>
      </div>

      <div className="card">
          <div className="card-header">
            <h3>Location Permissions</h3>
          </div>
          <div className="card-body">
            <p style={{ marginTop: 0 }}>Grant server-side location consent for all users. Note: this sets a server flag so the app can use IP-based location fallback automatically; it cannot override browser-level geolocation permissions.</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (!confirm('Grant location consent to ALL users? This cannot be undone easily.')) return;
                  setGranting(true);
                  try {
                    const { data } = await adminAPI.grantLocationPermissionToAll();
                    setToastMessage(`Granted to ${data.modifiedCount || 0} users`);
                    setToastType('success');
                  } catch (err) {
                    console.error('Grant failed', err);
                    setToastMessage(err?.response?.data?.message || 'Failed to grant');
                    setToastType('error');
                  } finally {
                    setGranting(false);
                  }
                }}
                disabled={granting}
              >
                {granting ? 'Granting...' : 'Grant Location Consent to All Users'}
              </button>
              <small className="text-muted">This will mark users server-side for automatic IP-based location fallback.</small>
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
