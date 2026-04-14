import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchAlerts } from '../utils/api';
import { ALERTS_UPDATED_EVENT, CSV_UPLOADED_KEY, USAGE_DATA_UPDATED_EVENT } from '../utils/cloudEvents';
import logo from '../assets/CloudOptix_logo.png';
import './Header.css';

export default function Header({ onLogout, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  const [csvUploaded, setCsvUploaded] = useState(() => localStorage.getItem(CSV_UPLOADED_KEY) === 'true');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      // Only fetch & show count if a CSV has been uploaded
      if (!localStorage.getItem(CSV_UPLOADED_KEY)) return;
      try {
        const data = await fetchAlerts();
        if (mounted) {
          setAlertCount(Array.isArray(data) ? data.filter((a) => a.status === 'unread').length : 0);
        }
      } catch {
        if (mounted) setAlertCount(0);
      }
    };

    const handleAlertsUpdated = () => {
      loadAlerts();
    };

    // When a CSV is uploaded, mark the flag and immediately load the count
    const handleUsageUpdated = () => {
      setCsvUploaded(true);
      loadAlerts();
    };

    loadAlerts();
    window.addEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
    window.addEventListener(USAGE_DATA_UPDATED_EVENT, handleUsageUpdated);

    return () => {
      mounted = false;
      window.removeEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
      window.removeEventListener(USAGE_DATA_UPDATED_EVENT, handleUsageUpdated);
    };
  }, []);

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Cloud Usage', path: '/cloud-usage' },
    { label: 'Cost Leaks', path: '/cost-leaks' },
    { label: 'Reports', path: '/reports' },
  ];

  if (user?.role === 'Admin') {
    navLinks.push({ label: 'Admin', path: '/admin' });
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo" onClick={() => navigate(user?.role === 'Admin' ? '/admin' : '/dashboard')}>
          <img src={logo} alt="CloudOptix Logo" className="logo-image" />
        </div>

        <button className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className="header-nav">
          <ul className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
            {navLinks.map((link) => (
              <li key={link.path}>
                <a
                  href={link.path}
                  className={location.pathname === link.path ? 'active-link' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(link.path);
                    setIsMenuOpen(false); // Close menu on navigation
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}

            <li className="alert-link">
              <a
                href="/alerts"
                className={location.pathname === '/alerts' ? 'active-link' : ''}
                onClick={(event) => {
                  event.preventDefault();
                  navigate('/alerts');
                  setIsMenuOpen(false); // Close menu on navigation
                }}
              >
                Alerts
                {csvUploaded && alertCount > 0 && <span className="alert-badge">{alertCount}</span>}
              </a>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          <button
            className={`profile-btn${location.pathname === '/profile' ? ' profile-btn--active' : ''}`}
            onClick={() => navigate('/profile')}
            title={user?.name ? `${user.name}'s profile` : 'My profile'}
            aria-label="View profile"
          >
            <span className="profile-btn-ring" aria-hidden="true" />
            <span className="profile-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </span>
          </button>

          <button className="logout-btn" onClick={() => { onLogout(); navigate('/login'); }}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
