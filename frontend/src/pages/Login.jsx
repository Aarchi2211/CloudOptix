import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Login.css';
import { loginUser } from '../utils/api';
import { getHomeRoute, storeAuthData } from '../utils/auth';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      storeAuthData({
        token: data.token,
        user: data.user,
      });

      if (onLoginSuccess) {
        onLoginSuccess({
          token: data.token,
          user: data.user,
        });
      }

      navigate(getHomeRoute(data.user), { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome Back</h2>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="form-note">
            Sign in to review cloud billing trends, investigate cost leakage, and manage alerts in one workspace.
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Login'}
          </button>
        </form>

        <p className="register-link">
          Don&apos;t have an account?
          <Link to="/register"> Register here</Link>
        </p>
      </div>
    </div>
  );
}
