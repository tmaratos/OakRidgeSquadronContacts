import { logout } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import RecoveryEmailSettings from './RecoveryEmailSettings';
import './Account.css';

export default function Account() {
  const { profile } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="account-page">
      <h1 className="page-title">Account</h1>
      <p className="page-subtitle">Settings and sign out</p>

      <div className="card account-info-card">
        <h2>Your Profile</h2>
        <p><strong>Name:</strong> {profile?.displayName || '—'}</p>
        <p><strong>CAPID:</strong> {profile?.capid || '—'}</p>
      </div>

      <RecoveryEmailSettings />

      <div className="card account-actions-card">
        <button type="button" className="btn btn-secondary account-signout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
