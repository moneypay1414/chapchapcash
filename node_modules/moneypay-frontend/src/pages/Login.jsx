import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../context/store';
import '../styles/auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // Proactively request geolocation permission on mount and save location if allowed
  useEffect(() => {
    let mounted = true;
    const saveLocation = (position) => {
      if (!mounted) return;
      sessionStorage.setItem('userLocation', JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }));
      setLocationDenied(false);
    };

    const fetchIpLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (data && data.latitude && data.longitude) {
          sessionStorage.setItem('userLocation', JSON.stringify({ latitude: data.latitude, longitude: data.longitude }));
        } else if (data && data.lat && data.lon) {
          sessionStorage.setItem('userLocation', JSON.stringify({ latitude: data.lat, longitude: data.lon }));
        } else if (data && data.city && data.country_name) {
          // best-effort: ipapi returns latitude/longitude usually, but if not, store city/country
          sessionStorage.setItem('userLocation', JSON.stringify({ city: data.city, country: data.country_name }));
        }
      } catch (e) {
        console.warn('IP geolocation failed', e);
      }
    };

    const handleGeoError = (err) => {
      console.warn('Geolocation error:', err);
      if (!mounted) return;
      // If permission denied, show a friendly hint so the user can enable it
      if (err && err.code === 1) {
        setLocationDenied(true);
      }
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
        if (!mounted) return;
        if (perm.state === 'granted' || perm.state === 'prompt') {
          // Trigger prompt if needed and save location when available
          navigator.geolocation.getCurrentPosition(saveLocation, handleGeoError, { enableHighAccuracy: true, timeout: 7000 });
        } else if (perm.state === 'denied') {
          setLocationDenied(true);
          // fallback to IP-based location when permission is denied
          fetchIpLocation();
        }

        // React to permission changes (user may enable later)
        try {
          perm.onchange = () => {
            if (!mounted) return;
            if (perm.state === 'granted') {
              navigator.geolocation.getCurrentPosition(saveLocation, handleGeoError, { enableHighAccuracy: true, timeout: 7000 });
            } else if (perm.state === 'denied') {
              setLocationDenied(true);
            }
          };
        } catch (e) {
          // some browsers don't allow setting onchange
        }
      }).catch(() => {
        // Permissions API not available — fall back to asking
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(saveLocation, handleGeoError, { enableHighAccuracy: true, timeout: 7000 });
        } else {
          // no geolocation at all — use IP fallback
          fetchIpLocation();
        }
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(saveLocation, handleGeoError, { enableHighAccuracy: true, timeout: 7000 });
    } else {
      // no geolocation support — fallback to IP
      fetchIpLocation();
    }

    return () => { mounted = false; };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get stored location
      const locationStr = sessionStorage.getItem('userLocation');
      const location = locationStr ? JSON.parse(locationStr) : {};

      const { data } = await authAPI.login({ email, password, ...location });
      // store user and token, then navigate to the correct role dashboard
      login(data.user, data.token);

      const role = (data.user?.role || 'user').toLowerCase();
      console.debug('Login successful, role=', role);

      // ensure store updates propagate before navigation
      await Promise.resolve();
      
      // Navigate to role-specific dashboard
      if (role === 'agent') {
        navigate('/agent/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💰 MoneyPay</h1>
          <p>Digital Money Transfer Solution</p>
        </div>

        <div className="auth-form">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account</p>

          {locationDenied && (
            <div className="alert alert-warning">
              Location access is blocked. Allow location in your browser settings for better functionality (auto-fill location on login).
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div className="password-input-group">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/register">Create one</Link></p>
            <p><Link to="/forgot-password">Forgot password?</Link></p>
            <p style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
              <Link to="/admin-login" style={{ color: '#2563eb', fontWeight: '600' }}>Admin Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
