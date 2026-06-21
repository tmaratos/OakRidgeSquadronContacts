import { useState } from 'react';
import { logout } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import RecoveryEmailSettings from './RecoveryEmailSettings';
import ImportContacts, { ImportContactsButton } from './ImportContacts';
import './Account.css';

export default function Account() {
  const { profile } = useAuth();
  const [showImport, setShowImport] = useState(false);

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
        <h2>Import Contacts</h2>
        <p className="account-section-desc">
          Upload vCard, CSV, or pick from your device. Imports default to private.
        </p>
        <ImportContactsButton onClick={() => setShowImport(true)} className="btn btn-primary" />
      </div>

      <div className="card account-actions-card">
        <button type="button" className="btn btn-secondary account-signout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      <ImportContacts open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
