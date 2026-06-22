import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getVisibleContacts,
  contactMatchesSearch,
  updateContact,
  deleteContact,
  getPrimaryEmail,
  getPrimaryPhone,
} from '../services/contactService';
import { groupContactsByOrganization } from '../utils/searchUtils';
import ContactCard from './ContactCard';
import ContactDetailsModal from './ContactDetailsModal';
import ContactFormSheet from './ContactFormSheet';
import './ContactCard.css';
import './Contacts.css';
import './Directory.css';
import './Organizations.css';

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'people', label: 'People' },
  { key: 'organizations', label: 'Organizations' },
  { key: 'mine', label: 'Mine' },
  { key: 'shared', label: 'Shared' },
  { key: 'donors', label: 'Donors' },
  { key: 'agencies', label: 'Agencies' },
  { key: 'schools', label: 'Schools' },
  { key: 'vendors', label: 'Vendors' },
];

function contactMatchesChip(contact, chip, userUid) {
  switch (chip) {
    case 'all':
      return true;
    case 'people':
      return contact.contactType === 'Individual' || !contact.contactType;
    case 'organizations':
      return Boolean((contact.organization || '').trim());
    case 'mine':
      return contact.ownerUid === userUid;
    case 'shared':
      return contact.visibility === 'shared';
    case 'donors':
      return contact.contactType === 'Donor' || contact.category === 'Donor / Fundraising';
    case 'agencies':
      return contact.contactType === 'Government' || contact.category === 'Project / Agency';
    case 'schools':
      return contact.contactType === 'School';
    case 'vendors':
      return contact.contactType === 'Vendor' || contact.category === 'Vendor / Supplier';
    default:
      return true;
  }
}

export default function Directory({ onContactsChanged }) {
  const { user, profile } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const [expandedOrgKey, setExpandedOrgKey] = useState(null);
  const [viewContact, setViewContact] = useState(null);
  const [editContact, setEditContact] = useState(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getVisibleContacts(user.uid);
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setContacts([]);
      const message = err?.message || '';
      if (err?.code === 'permission-denied') {
        setLoadError('Permission denied loading contacts. Your account may not be active.');
      } else if (err?.code === 'failed-precondition' || message.includes('index')) {
        setLoadError(
          'Unable to load contacts — Firestore indexes may still be building. Try again in a few minutes.'
        );
      } else {
        setLoadError('Unable to load contacts. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    onContactsChanged?.(loadContacts);
  }, [loadContacts, onContactsChanged]);

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) =>
          contactMatchesSearch(c, search) &&
          contactMatchesChip(c, activeChip, user.uid)
      ),
    [contacts, search, activeChip, user.uid]
  );

  const organizations = useMemo(() => {
    const withOrg = contacts.filter((c) => (c.organization || '').trim());
    const searchFiltered = search.trim()
      ? withOrg.filter((c) => contactMatchesSearch(c, search))
      : withOrg;
    return groupContactsByOrganization(searchFiltered);
  }, [contacts, search]);

  const handleUpdate = async (formData) => {
    await updateContact(editContact.id, formData, { uid: user.uid, profile }, editContact);
    setEditContact(null);
    setViewContact(null);
    await loadContacts();
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Delete "${contact.name}"? This cannot be undone.`)) return;
    await deleteContact(contact.id);
    setViewContact(null);
    await loadContacts();
  };

  const handleShare = async (contact) => {
    if (contact.visibility === 'shared') return;
    await updateContact(
      contact.id,
      { ...contact, visibility: 'shared' },
      { uid: user.uid, profile },
      contact
    );
    setViewContact(null);
    await loadContacts();
  };

  const toggleOrgExpand = (key) => {
    setExpandedOrgKey((prev) => (prev === key ? null : key));
  };

  const showOrgView = activeChip === 'organizations';

  return (
    <div className="directory-page">
      <h1 className="page-title">Directory</h1>
      <p className="page-subtitle">Search and browse squadron contacts</p>

      <div className="directory-search-sticky">
        <input
          type="search"
          className="search-bar-large"
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search contacts"
        />
      </div>

      <div className="filter-chips" role="tablist" aria-label="Contact filters">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            role="tab"
            aria-selected={activeChip === chip.key}
            className={`filter-chip ${activeChip === chip.key ? 'active' : ''}`}
            onClick={() => {
              setActiveChip(chip.key);
              setExpandedOrgKey(null);
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {loadError && <p className="error-message">{loadError}</p>}

      {loading ? (
        <p className="empty-message">Loading contacts…</p>
      ) : showOrgView ? (
        !organizations.length ? (
          <p className="empty-message">No organizations found.</p>
        ) : (
          <div className="org-list">
            {organizations.map((group) => {
              const isExpanded = expandedOrgKey === group.key;
              return (
                <div key={group.key} className="card org-card">
                  <button
                    type="button"
                    className="org-card-header"
                    onClick={() => toggleOrgExpand(group.key)}
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
                            {contact.title && (
                              <span className="org-contact-title">{contact.title}</span>
                            )}
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
        )
      ) : filteredContacts.length ? (
        <div className="contact-cards-grid">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onView={setViewContact}
              showOwner
            />
          ))}
        </div>
      ) : (
        <p className="empty-message">No contacts found.</p>
      )}

      {viewContact && (
        <ContactDetailsModal
          contact={viewContact}
          onClose={() => setViewContact(null)}
          canEdit={viewContact.ownerUid === user.uid}
          onEdit={(c) => {
            setViewContact(null);
            setEditContact(c);
          }}
          onDelete={viewContact.ownerUid === user.uid ? handleDelete : undefined}
          onShare={
            viewContact.ownerUid === user.uid && viewContact.visibility !== 'shared'
              ? handleShare
              : undefined
          }
        />
      )}

      {editContact && (
        <ContactFormSheet
          title="Edit Contact"
          initialData={editContact}
          onSubmit={handleUpdate}
          onClose={() => setEditContact(null)}
          submitLabel="Update Contact"
        />
      )}
    </div>
  );
}
