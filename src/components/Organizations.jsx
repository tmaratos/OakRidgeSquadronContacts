import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getVisibleContacts,
  contactMatchesSearch,
  getPrimaryEmail,
  getPrimaryPhone,
  getPreferredMethodLabel,
} from '../services/contactService';
import {
  groupContactsByOrganization,
  summarizeOrganization,
  getUniqueOrganizations,
} from '../utils/searchUtils';
import GlobalSearchBar from './GlobalSearchBar';
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
      const summary = summarizeOrganization(group);
      const orgSearchText = [
        group.displayName,
        group.key,
        ...summary.categories,
        ...summary.contactTypes,
        ...summary.tags,
        summary.notesPreview,
        ...group.contacts.flatMap((c) => [c.name, c.title, c.notes]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (orgSearchText.includes(term)) return true;
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
      <p className="page-subtitle">
        Contacts grouped by organization from your visible contacts
      </p>

      <GlobalSearchBar value={search} onChange={setSearch} />

      {!organizations.length ? (
        <div className="card org-empty-state">
          <p className="empty-message">
            No organizations yet. Add an organization name to a contact to group it here.
          </p>
        </div>
      ) : (
        <div className="org-list">
          {organizations.map((group) => {
            const summary = summarizeOrganization(group);
            const primary = summary.primaryContact;
            const primaryEmail = primary ? getPrimaryEmail(primary) : null;
            const primaryPhone = primary ? getPrimaryPhone(primary) : null;
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
                    <span className="org-count">{summary.contactCount} contact{summary.contactCount !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="org-expand-icon">{isExpanded ? '−' : '+'}</span>
                </button>

                <div className="org-summary">
                  {summary.categories.length > 0 && (
                    <p><strong>Categories:</strong> {summary.categories.join(', ')}</p>
                  )}
                  {summary.contactTypes.length > 0 && (
                    <p><strong>Types:</strong> {summary.contactTypes.join(', ')}</p>
                  )}
                  {primary && (
                    <p><strong>Primary Contact:</strong> {primary.name}{primary.title ? ` — ${primary.title}` : ''}</p>
                  )}
                  {primaryEmail && (
                    <p><strong>Primary Email:</strong> {primaryEmail.value}</p>
                  )}
                  {primaryPhone && (
                    <p><strong>Primary Phone:</strong> {primaryPhone.value}</p>
                  )}
                  {summary.preferredMethods.length > 0 && (
                    <p>
                      <strong>Preferred Methods:</strong>{' '}
                      {[...new Set(summary.preferredMethods.map(getPreferredMethodLabel))].join(', ')}
                    </p>
                  )}
                  {summary.mostRecentLastContact && (
                    <p><strong>Last Contacted:</strong> {summary.mostRecentLastContact}</p>
                  )}
                  {summary.earliestFollowUp && (
                    <p><strong>Next Follow-Up:</strong> {summary.earliestFollowUp}</p>
                  )}
                  {summary.tags.length > 0 && (
                    <p><strong>Tags:</strong> {summary.tags.join(', ')}</p>
                  )}
                  {summary.notesPreview && (
                    <p className="org-notes-preview"><strong>Notes:</strong> {summary.notesPreview.slice(0, 120)}{summary.notesPreview.length > 120 ? '…' : ''}</p>
                  )}
                </div>

                {isExpanded && (
                  <div className="org-contacts-list">
                    <h3>Contacts in {group.displayName}</h3>
                    {group.contacts.map((contact) => {
                      const email = getPrimaryEmail(contact);
                      const phone = getPrimaryPhone(contact);
                      const ownerLabel = contact.visibility === 'shared' && contact.sharedBy
                        ? contact.sharedBy
                        : contact.ownerDisplayName;

                      return (
                        <div key={contact.id} className="org-contact-row">
                          <div className="org-contact-main">
                            <button type="button" className="link-btn" onClick={() => setViewContact(contact)}>
                              {contact.name}
                            </button>
                            {contact.title && <span className="org-contact-title">{contact.title}</span>}
                          </div>
                          <div className="org-contact-meta">
                            {email && <span>{email.value}</span>}
                            {phone && <span>{phone.value}</span>}
                            <span>{getPreferredMethodLabel(contact.preferredContactMethod)}</span>
                            <span>{contact.category}</span>
                            <span>{contact.contactType}</span>
                            {contact.relationshipOwner && <span>Owner: {contact.relationshipOwner}</span>}
                            {contact.notes && (
                              <span className="org-contact-notes">{contact.notes.slice(0, 80)}{contact.notes.length > 80 ? '…' : ''}</span>
                            )}
                            <span className={`badge badge-${contact.visibility}`}>{contact.visibility}</span>
                            {ownerLabel && <span>{ownerLabel}</span>}
                          </div>
                        </div>
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
