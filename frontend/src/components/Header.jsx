import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/CloudOptix_logo.png';
import './Header.css';

export default function Header({ onLogout }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        {/* Logo / Project Name */}
        <div className="header-logo">
          <img src={logo} alt="CloudOptix Logo" className="logo-image" />
        </div>

        {/* Navigation Links */}
        <nav className="header-nav">
          <ul className="nav-links">
            {navLinks.map(link => (
              <li key={link.path}>
                <a 
                  href={link.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.path);
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="header-actions">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
