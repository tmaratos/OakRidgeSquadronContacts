import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyContacts,
  getSharedContacts,
  getVisibleContacts,
  contactMatchesSearch,
} from '../services/contactService';
import { computeOrganizationStats } from '../utils/searchUtils';
import GlobalSearchBar from './GlobalSearchBar';
import ContactTable from './ContactTable';
import ContactDetailsModal from './ContactDetailsModal';
import ImportContacts, { ImportContactsButton } from './ImportContacts';
import './Dashboard.css';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    myContacts: 0,
    sharedContacts: 0,
    loading: true,
  });
  const [orgStats, setOrgStats] = useState({
    total: 0,
    withFollowUps: 0,
    donorCount: 0,
    recentlyUpdated: [],
    loading: true,
  });
  const [visibleContacts, setVisibleContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [viewContact, setViewContact] = useState(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const [mine, shared, visible] = await Promise.all([
          getMyContacts(user.uid),
          getSharedContacts(),
          getVisibleContacts(user.uid),
        ]);
        const orgData = computeOrganizationStats(visible);
        setStats({
          myContacts: mine.length,
          sharedContacts: shared.length,
          loading: false,
        });
        setOrgStats({
          total: orgData.total,
          withFollowUps: orgData.withFollowUps,
          donorCount: orgData.donorCount,
          recentlyUpdated: orgData.recentlyUpdated,
          loading: false,
        });
        setVisibleContacts(visible);
      } catch {
        setStats((s) => ({ ...s, loading: false }));
        setOrgStats((s) => ({ ...s, loading: false }));
      }
    }
    if (user) loadStats();
  }, [user]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return visibleContacts.filter((c) => contactMatchesSearch(c, search));
  }, [visibleContacts, search]);

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Welcome back, {profile?.displayName}. Manage squadron contacts from here.
      </p>

      <GlobalSearchBar value={search} onChange={setSearch} />

      {search.trim() && (
        <div className="card dashboard-search-results">
          <h2>Search Results ({searchResults.length})</h2>
          {searchResults.length ? (
            <ContactTable contacts={searchResults} onView={setViewContact} showOwner />
          ) : (
            <p className="empty-message">No contacts match your search.</p>
          )}
        </div>
      )}

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

      <h2 className="section-heading">Organizations</h2>
      <div className="dashboard-grid org-stats-grid">
        <div className="card stat-card">
          <h2>Total Organizations</h2>
          <p className="stat-number">{orgStats.loading ? '—' : orgStats.total}</p>
          <Link to="/organizations" className="btn btn-outline btn-sm">
            View Organizations
          </Link>
        </div>

        <div className="card stat-card">
          <h2>Recently Updated</h2>
          <p className="stat-number">{orgStats.loading ? '—' : orgStats.recentlyUpdated.length}</p>
          <p className="stat-desc">Organizations with recent contact updates</p>
        </div>

        <div className="card stat-card">
          <h2>With Follow-Ups</h2>
          <p className="stat-number">{orgStats.loading ? '—' : orgStats.withFollowUps}</p>
          <p className="stat-desc">Organizations with scheduled follow-ups</p>
        </div>

        <div className="card stat-card">
          <h2>Donor / Fundraising</h2>
          <p className="stat-number">{orgStats.loading ? '—' : orgStats.donorCount}</p>
          <p className="stat-desc">Donor or fundraising organizations</p>
        </div>
      </div>

      {!orgStats.loading && orgStats.recentlyUpdated.length > 0 && (
        <div className="card dashboard-recent-orgs">
          <h2>Recently Updated Organizations</h2>
          <ul className="recent-org-list">
            {orgStats.recentlyUpdated.map((group) => (
              <li key={group.key}>
                <Link to="/organizations">{group.displayName}</Link>
                <span className="recent-org-count">{group.contacts.length} contacts</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/my-contacts?new=1" className="btn btn-primary">
            Add Contact
          </Link>
          <ImportContactsButton onClick={() => setShowImport(true)} className="btn btn-primary" />
          <Link to="/organizations" className="btn btn-primary">
            View Organizations
          </Link>
          <Link to="/shared-contacts" className="btn btn-secondary">
            View Shared Contacts
          </Link>
          <Link to="/my-contacts" className="btn btn-secondary">
            View My Contacts
          </Link>
        </div>
      </div>

      {viewContact && (
        <ContactDetailsModal
          contact={viewContact}
          onClose={() => setViewContact(null)}
          canEdit={viewContact.ownerUid === user.uid}
        />
      )}

      <ImportContacts open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
