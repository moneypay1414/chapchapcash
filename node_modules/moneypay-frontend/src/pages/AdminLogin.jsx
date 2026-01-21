import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../context/store';
import '../styles/auth.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  // Capture geolocation on component mount
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
          sessionStorage.setItem('userLocation', JSON.stringify({ city: data.city, country: data.country_name }));
        }
      } catch (e) {
        console.warn('IP geolocation failed', e);
      }
    };

    const handleGeoError = (err) => {
      console.warn('Geolocation error:', err);
      if (!mounted) return;
      if (err && err.code === 1) setLocationDenied(true);
    };

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
        if (!mounted) return;
        if (perm.state === 'granted' || perm.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(saveLocation, handleGeoError, { enableHighAccuracy: true, timeout: 7000 });
        } else if (perm.state === 'denied') {
          setLocationDenied(true);
          // fallback to IP-based location when permission is denied
          fetchIpLocation();
        }

        try {
          perm.onchange = () => {
            if (!mounted) return;
            if (perm.state === 'granted') navigator.geolocation.getCurrentPosition(saveLocation, handleGeoError, { enableHighAccuracy: true, timeout: 7000 });
            else if (perm.state === 'denied') setLocationDenied(true);
          };
        } catch (e) {}
      }).catch(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(saveLocation, handleGeoError, { enableHighAccuracy: true, timeout: 7000 });
        } else {
          fetchIpLocation();
        }
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(saveLocation, handleGeoError, { enableHighAccuracy: true, timeout: 7000 });
    } else {
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
      
      // Check if user is admin
      if (data.user?.role !== 'admin') {
        setError('Admin access only. Please use your admin credentials.');
        setLoading(false);
        return;
      }

      login(data.user, data.token);
      console.debug('Admin login successful');

      await Promise.resolve();
      navigate('/admin/dashboard');
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
          <p>Admin Portal</p>
        </div>

        <div className="auth-form">
          <h2>Admin Login</h2>
          <p className="auth-subtitle">Sign in to admin dashboard</p>

          {locationDenied && (
            <div className="alert alert-warning">
              Location access is blocked. Allow location in your browser settings for better functionality (auto-fill location on login).
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="admin-email">Email Address</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="password-input-group">
                <input
                  id="admin-password"
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
            <p><Link to="/admin-register">Register as Admin</Link></p>
            <p><Link to="/login">Back to User Login</Link></p>
            <p><Link to="/forgot-password">Forgot password?</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
