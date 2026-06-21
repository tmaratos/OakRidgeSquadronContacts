import { useState } from 'react';
import { updateRecoveryEmail } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import './RecoveryEmailSettings.css';

export default function RecoveryEmailSettings() {
  const { profile, refreshProfile } = useAuth();
  const [recoveryEmail, setRecoveryEmail] = useState(profile?.recoveryEmail || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = recoveryEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid recovery email address.');
      return;
    }

    setLoading(true);
    try {
      await updateRecoveryEmail(trimmed);
      await refreshProfile();
      setSuccess('Recovery email updated.');
    } catch (err) {
      console.error('Recovery email update failed:', err);
      setError('Unable to update recovery email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="recovery-email-settings card">
      <h2>Recovery Email</h2>
      <p className="recovery-email-intro">
        Used for password resets. This is not your sign-in username.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="recovery-email">Recovery Email</label>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save Recovery Email'}
        </button>
      </form>
    </section>
  );
}
