import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import '../styles/auth.css';
import Toast from '../components/Toast';

export default function Register() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    agentId: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Generate unique 6-digit agent ID when role changes to agent
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    let newFormData = { ...formData, role: newRole };
    
    if (newRole === 'agent' && !formData.agentId) {
      // Generate unique 6-digit agent ID
      const agentId = Math.floor(Math.random() * 900000) + 100000;
      newFormData.agentId = agentId.toString();
    }
    
    setFormData(newFormData);
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
      // show toast then navigate
      setToast({ message: 'Phone verified! You can now login.', type: 'success' });
      setTimeout(() => navigate('/login'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState({ message: '', type: 'info' });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>💰 MoneyPay</h1>
          <p>Digital Money Transfer Solution</p>
        </div>

        <div className="auth-form">
          <h2>{step === 1 ? 'Create Account' : 'Verify Phone'}</h2>
          <p className="auth-subtitle">
            {step === 1 ? 'Join MoneyPay today' : 'Enter the code sent to your phone'}
          </p>

          {error && <div className="alert alert-danger">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
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
                <label htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                    type="email"
                    autoComplete="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone">Phone Number</label>
                <input
                  id="reg-phone"
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
                <label htmlFor="reg-role">Account Type</label>
                <select id="reg-role" name="role" value={formData.role} onChange={handleRoleChange}>
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                </select>
              </div>

              {formData.role === 'agent' && (
                <div className="form-group">
                  <label htmlFor="reg-agent-id">Agent ID (Auto-generated)</label>
                  <input
                    id="reg-agent-id"
                    type="text"
                    name="agentId"
                    autoComplete="off"
                    value={formData.agentId}
                    disabled
                    readOnly
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                  <small className="text-muted">Your unique agent ID has been generated automatically</small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <div className="password-input-group">
                  <input
                    id="reg-password"
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

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label htmlFor="verify-code">Verification Code</label>
                <p className="text-small text-muted mb-2">
                  We sent a 6-digit code to {formData.phone}
                </p>
                <input
                  id="verify-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  placeholder="000000"
                  maxLength="6"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
          </div>
          {toast.message && (
            <Toast
              message={toast.message}
              type={toast.type}
              duration={3000}
              onClose={() => setToast({ message: '', type: 'info' })}
            />
          )}
      </div>
    </div>
  );
}
