import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getVisibleContacts,
  contactMatchesSearch,
  getPrimaryEmail,
  getPrimaryPhone,
} from '../services/contactService';
import { groupContactsByOrganization } from '../utils/searchUtils';
import ContactDetailsModal from './ContactDetailsModal';
import './Organizations.css';

export default function Organizations() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);
  const [viewContact, setViewContact] = useState(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVisibleContacts(user.uid);
      setContacts(data);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const organizations = useMemo(() => {
    const groups = groupContactsByOrganization(contacts);
    if (!search.trim()) return groups;

    const term = search.toLowerCase().trim();
    return groups.filter((group) => {
      if (group.displayName.toLowerCase().includes(term)) return true;
      return group.contacts.some((c) => contactMatchesSearch(c, search));
    });
  }, [contacts, search]);

  const toggleExpand = (key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  if (loading) {
    return <p className="empty-message">Loading organizations…</p>;
  }

  return (
    <div className="organizations-page">
      <h1 className="page-title">Organizations</h1>
      <p className="page-subtitle">Contacts grouped by organization</p>

      <div className="org-search-sticky">
        <input
          type="search"
          className="search-bar-large"
          placeholder="Search organizations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search organizations"
        />
      </div>

      {!organizations.length ? (
        <div className="card org-empty-state">
          <p className="empty-message">
            No organizations yet. Add an organization name to a contact to group it here.
          </p>
        </div>
      ) : (
        <div className="org-list">
          {organizations.map((group) => {
            const isExpanded = expandedKey === group.key;

            return (
              <div key={group.key} className="card org-card">
                <button
                  type="button"
                  className="org-card-header"
                  onClick={() => toggleExpand(group.key)}
                  aria-expanded={isExpanded}
                >
                  <div className="org-card-title">
                    <h2>{group.displayName}</h2>
                    <span className="org-count">
                      {group.contacts.length} contact{group.contacts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="org-expand-icon">{isExpanded ? '−' : '+'}</span>
                </button>

                {isExpanded && (
                  <div className="org-contacts-list">
                    {group.contacts.map((contact) => {
                      const email = getPrimaryEmail(contact);
                      const phone = getPrimaryPhone(contact);

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          className="org-contact-row org-contact-tappable"
                          onClick={() => setViewContact(contact)}
                        >
                          <span className="org-contact-name">{contact.name}</span>
                          {contact.title && <span className="org-contact-title">{contact.title}</span>}
                          <span className="org-contact-meta-line">
                            {phone?.value && <span>{phone.value}</span>}
                            {email?.value && <span>{email.value}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewContact && (
        <ContactDetailsModal
          contact={viewContact}
          onClose={() => setViewContact(null)}
          canEdit={viewContact.ownerUid === user.uid}
        />
      )}
    </div>
  );
}
