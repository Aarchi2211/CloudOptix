import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { clearAuthData, getAuthUser } from '../utils/auth';

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');

  const [userDetails, setUserDetails] = useState(() => {
    const user = getAuthUser();

    if (user) {
      return {
        name: user.name || 'User',
        email: user.email || '',
        role: user.role || 'User',
        id: user.id || '',
      };
    }

    return {
      name: 'User',
      email: '',
      role: 'User',
      id: '',
    };
  });

  const [editMode, setEditMode] = useState(false);
  const [editDetails, setEditDetails] = useState(userDetails);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditDetails({ ...editDetails, [name]: value });
  };

  const handleSaveDetails = () => {
    setUserDetails(editDetails);
    setEditMode(false);
    alert('Profile details updated successfully!');
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError('New password is required');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordSuccess('Password changed successfully!');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      clearAuthData();
      navigate('/');
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </header>

      <div className="profile-content">
        <aside className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-placeholder">{userDetails.name.charAt(0).toUpperCase()}</div>
            <h3>{userDetails.name}</h3>
            <p className="role-badge">{userDetails.role}</p>
          </div>

          <nav className="profile-nav">
            <button className={`nav-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
              Profile Details
            </button>
            <button className={`nav-item ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              Change Password
            </button>
            <button className="nav-item logout" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </aside>

        <main className="profile-main">
          {activeTab === 'details' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>Profile Details</h2>
                {!editMode && (
                  <button
                    className="btn-edit"
                    onClick={() => {
                      setEditMode(true);
                      setEditDetails(userDetails);
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {editMode ? (
                <form className="profile-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={editDetails.name} onChange={handleEditChange} />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={editDetails.email} disabled />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <input type="text" name="role" value={editDetails.role} disabled />
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-save" onClick={handleSaveDetails}>
                      Save Changes
                    </button>
                    <button type="button" className="btn-cancel" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="details-display">
                  <div className="detail-item">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{userDetails.name}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value">{userDetails.email}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Role</span>
                    <span className="detail-value">{userDetails.role}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>Change Password</h2>
              </div>

              <form className="password-form" onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input-group">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                    >
                      {showPassword.current ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-group">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password (minimum 8 characters)"
                    />
                    <button
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                    >
                      {showPassword.new ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <small className="password-hint">Minimum 8 characters required</small>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-group">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="btn-toggle-password"
                      onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                    >
                      {showPassword.confirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {passwordError && <div className="alert alert-error">{passwordError}</div>}
                {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}

                <button type="submit" className="btn-change-password">
                  Update Password
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
