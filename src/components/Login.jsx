import { useState } from 'react';
import { loginWithCapid } from '../services/authService';
import './Login.css';

export default function Login({ onForgotPassword }) {
  const [capid, setCapid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithCapid(capid.trim(), password);
    } catch (err) {
      console.error('Login failed:', err.code || err.message);
      setError('Invalid CAPID or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <img
            src={`${import.meta.env.BASE_URL}squadron-logo.svg`}
            alt="Oak Ridge Composite Squadron TN-170"
            className="login-logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${import.meta.env.BASE_URL}squadron-logo.jpeg`;
            }}
          />
          <h1>Contact Directory</h1>
          <p className="login-subtitle">Oak Ridge Composite Squadron TN-170</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="capid">CAPID</label>
            <input
              id="capid"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              value={capid}
              onChange={(e) => setCapid(e.target.value)}
              placeholder="Enter your CAPID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <button type="button" className="forgot-link" onClick={onForgotPassword}>
          Forgot password?
        </button>
      </div>
    </div>
  );
}
