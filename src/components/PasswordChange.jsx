import { useState } from 'react';
import { changePassword } from '../services/authService';
import { clearMustChangePassword } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import './PasswordChange.css';

export default function PasswordChange() {
  const { user, profile, refreshProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (newPassword.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (newPassword === profile?.capid) {
      return 'Password cannot be the same as your CAPID.';
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await changePassword(newPassword);
      await clearMustChangePassword(user.uid);
      await refreshProfile();
    } catch (err) {
      setError('Unable to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-change-page">
      <div className="password-change-card card">
        <h1>Change Your Password</h1>
        <p className="password-change-intro">
          Welcome, {profile?.displayName}. You must set a new password before continuing.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <ul className="password-rules">
            <li>Minimum 8 characters</li>
            <li>Cannot be your CAPID</li>
            <li>Must match confirmation</li>
          </ul>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
