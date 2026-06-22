import { useState } from 'react';
import { requestPasswordReset } from '../services/passwordResetService';
import './Login.css';

const SUCCESS_MESSAGE =
  'If the CAPID and recovery email match an active account, a reset link has been sent.';

export default function ForgotPasswordForm({ onBack }) {
  const [capid, setCapid] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const message = await requestPasswordReset(capid.trim(), recoveryEmail.trim());
      setSuccess(message || SUCCESS_MESSAGE);
      setCapid('');
      setRecoveryEmail('');
    } catch (err) {
      console.error('Password reset request failed:', err);
      setError(err.message || 'Unable to process your request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-header">
          <h1>Forgot Password</h1>
          <p className="login-subtitle">
            Enter your CAPID and the recovery email on file for your account (for example your
            @tncap.us address). The reset link is sent to that recovery email — not your CAPID login.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-capid">CAPID</label>
            <input
              id="forgot-capid"
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
            <label htmlFor="forgot-recovery-email">Recovery Email</label>
            <input
              id="forgot-recovery-email"
              type="email"
              autoComplete="email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="e.g. 729204@tncap.us"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <button type="button" className="forgot-link" onClick={onBack}>
          Back to sign in
        </button>
      </div>
    </div>
  );
}
