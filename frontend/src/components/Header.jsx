import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchAlerts } from '../utils/api';
import { ALERTS_UPDATED_EVENT } from '../utils/cloudEvents';
import logo from '../assets/CloudOptix_logo.png';
import './Header.css';

export default function Header({ onLogout, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      try {
        const data = await fetchAlerts();
        if (mounted) {
          setAlertCount(Array.isArray(data) ? data.filter((alert) => alert.status === 'unread').length : 0);
        }
      } catch {
        if (mounted) {
          setAlertCount(0);
        }
      }
    };

    const handleAlertsUpdated = () => {
      loadAlerts();
    };

    loadAlerts();
    window.addEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);

    return () => {
      mounted = false;
      window.removeEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
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
                {alertCount > 0 && <span className="alert-badge">{alertCount}</span>}
              </a>
            </li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
