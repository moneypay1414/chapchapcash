import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import '../styles/auth.css';
import Toast from '../components/Toast';

export default function AdminRegister() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin'
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.register(formData);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.verifyPhone({
        phone: formData.phone,
        code: verificationCode
      });
      setToast({ message: 'Phone verified! You can now login as admin.', type: 'success' });
      setTimeout(() => navigate('/admin-login'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💰 MoneyPay</h1>
          <p>Admin Registration</p>
        </div>

        {step === 1 ? (
          <div className="auth-form">
            <h2>Create Admin Account</h2>
            <p className="auth-subtitle">Register a new administrator</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="admin-reg-name">Full Name</label>
                <input
                  id="admin-reg-name"
                  type="text"
                  autoComplete="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-reg-email">Email Address</label>
                <input
                  id="admin-reg-email"
                  type="email"
                  autoComplete="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="admin@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-reg-phone">Phone Number</label>
                <input
                  id="admin-reg-phone"
                  type="tel"
                  autoComplete="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+211..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="admin-reg-password">Password</label>
                <div className="password-input-group">
                  <input
                    id="admin-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
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

              <div className="form-group" style={{ backgroundColor: '#f0f9ff', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
                <strong style={{ color: '#2563eb' }}>ℹ️ Admin ID</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#666' }}>
                  A unique 6-digit Admin ID will be automatically generated for your account after registration.
                </p>
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'Registering...' : 'Create Admin Account'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have an account? <Link to="/admin-login">Sign in here</Link></p>
              <p><Link to="/login">Back to User Login</Link></p>
            </div>
          </div>
        ) : (
          <div className="auth-form">
            <h2>Verify Phone Number</h2>
            <p className="auth-subtitle">Enter the verification code sent to {formData.phone}</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label htmlFor="admin-verify-code">Verification Code</label>
                <input
                  id="admin-verify-code"
                  type="text"
                  autoComplete="one-time-code"
                  name="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  placeholder="000000"
                  maxLength="6"
                />
              </div>

              <button type="submit" className="btn btn-success btn-block btn-lg" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Phone Number'}
              </button>

              <button 
                type="button" 
                className="btn btn-secondary btn-block"
                onClick={() => setStep(1)}
              >
                Back
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
