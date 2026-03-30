import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/CloudOptix_logo.png';
import './Header.css';

const ALERTS_UPDATED_EVENT = 'cloud-alerts-updated';
const ALERTS_UPDATED_STORAGE_KEY = 'cloud-alerts-last-updated';

export default function Header({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/alerts');
        const data = await response.json();

        if (mounted) {
          setAlertCount(Array.isArray(data) ? data.length : 0);
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

    const handleStorage = (event) => {
      if (event.key === ALERTS_UPDATED_STORAGE_KEY) {
        loadAlerts();
      }
    };

    loadAlerts();
    window.addEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      mounted = false;
      window.removeEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout && onLogout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Cloud Usage', path: '/cloud-usage' },
    { label: 'Cost Leaks', path: '/cost-leaks' },
    { label: 'Reports', path: '/reports' },
  ];

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo" onClick={() => navigate('/dashboard')}>
          <img src={logo} alt="CloudOptix Logo" className="logo-image" />
        </div>

        <nav className="header-nav">
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <a
                  href={link.path}
                  className={location.pathname === link.path ? 'active-link' : ''}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(link.path);
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
                }}
              >
                Alerts
                {alertCount > 0 && <span className="alert-badge">{alertCount}</span>}
              </a>
            </li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
