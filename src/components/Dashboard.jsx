import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyContacts, getSharedContacts } from '../services/contactService';
import './Dashboard.css';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ myContacts: 0, sharedContacts: 0, loading: true });

  useEffect(() => {
    async function loadStats() {
      try {
        const [mine, shared] = await Promise.all([
          getMyContacts(user.uid),
          getSharedContacts(),
        ]);
        setStats({
          myContacts: mine.length,
          sharedContacts: shared.length,
          loading: false,
        });
      } catch {
        setStats((s) => ({ ...s, loading: false }));
      }
    }
    if (user) loadStats();
  }, [user]);

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Welcome back, {profile?.displayName}. Manage squadron contacts from here.
      </p>

      <div className="dashboard-grid">
        <div className="card stat-card">
          <h2>My Contacts</h2>
          <p className="stat-number">{stats.loading ? '—' : stats.myContacts}</p>
          <p className="stat-desc">Private and shared contacts you own</p>
          <Link to="/my-contacts" className="btn btn-primary btn-sm">
            View My Contacts
          </Link>
        </div>

        <div className="card stat-card">
          <h2>Shared Contacts</h2>
          <p className="stat-number">{stats.loading ? '—' : stats.sharedContacts}</p>
          <p className="stat-desc">Contacts shared across the squadron</p>
          <Link to="/shared-contacts" className="btn btn-primary btn-sm">
            View Shared Contacts
          </Link>
        </div>
      </div>

      <div className="card dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/my-contacts?new=1" className="btn btn-primary">
            Add New Contact
          </Link>
          <button type="button" className="btn btn-secondary" disabled title="Coming soon">
            Import Business Cards / CSV — Coming soon
          </button>
        </div>
      </div>
    </div>
  );
}
