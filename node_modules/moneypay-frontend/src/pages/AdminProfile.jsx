import { useState } from 'react';
import Footer from '../components/Footer';
import { useAuthStore } from '../context/store';
import '../styles/profile.css';

export default function AdminProfile() {
  const user = useAuthStore((state) => state.user);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: Implement profile update API call
    setEditing(false);
  };

  return (
    <>
    <div className="page-container">
      <div className="page-header">
        <h1>Admin Profile</h1>
        <p>Manage your admin account</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Account Details</h3>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="card-body">
            {editing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="form-group">
                  <label htmlFor="profile-name">Full Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile-email">Email Address</label>
                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block">Save Changes</button>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-row">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{user?.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{user?.phone}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Role:</span>
                  <span className="info-value">
                    <span className="badge badge-primary">Admin</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Admin Credentials</h3>
          </div>
          <div className="card-body">
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Admin ID:</span>
                <span className="info-value" style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px' }}>
                  {user?.adminId || 'N/A'}
                </span>
              </div>
              <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>
                Use this ID for system identification and administrative purposes
              </small>
            </div>

            <div className="profile-info" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd' }}>
              <div className="info-row">
                <span className="info-label">Account Status:</span>
                <span className="info-value">
                  <span className="badge badge-success">✓ Active</span>
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Permissions:</span>
                <span className="info-value">Full Administrative Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3>📋 Admin Information</h3>
        </div>
        <div className="card-body">
          <div className="info-box">
            <h4>Your Admin ID:</h4>
            <p>Your unique 6-digit Admin ID is used to identify your administrative account in the system. Keep this ID secure and do not share it with unauthorized users.</p>
          </div>
          <div className="info-box warning">
            <h4>⚠️ Security:</h4>
            <ul>
              <li>Never share your password with anyone</li>
              <li>Log out when finished using admin panel</li>
              <li>Report suspicious activity immediately</li>
              <li>Change your password regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
