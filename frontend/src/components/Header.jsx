import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/CloudOptix_logo.png';
import './Header.css';

export default function Header({ onLogout }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateAlerts = () => {
      const alerts = JSON.parse(localStorage.getItem("alerts")) || [];
      const unread = alerts.filter(a => a.status === "unread").length;
      setUnreadCount(unread);
    };

    updateAlerts();

    // ✅ Listen for custom event
    window.addEventListener("alertsUpdated", updateAlerts);

    return () => window.removeEventListener("alertsUpdated", updateAlerts);
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
    { label: 'Reports', path: '/reports' }
  ];

  return (
    <header className="header">
      <div className="header-container">

        <div className="header-logo" onClick={() => navigate('/dashboard')}>
          <img src={logo} alt="CloudOptix Logo" className="logo-image" />
        </div>

        <nav className="header-nav">
          <ul className="nav-links">

            {navLinks.map(link => (
              <li key={link.path}>
                <a href={link.path} onClick={(e) => {
                  e.preventDefault();
                  navigate(link.path);
                }}>
                  {link.label}
                </a>
              </li>
            ))}

            {/* 🔔 Alerts */}
            <li className="alert-link">
              <a href="/alerts" onClick={(e) => {
                e.preventDefault();
                navigate('/alerts');
              }}>
                🔔 Alerts
                {unreadCount > 0 && (
                  <span className="alert-badge">{unreadCount}</span>
                )}
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