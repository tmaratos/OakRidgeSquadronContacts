import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getVisibleContacts,
  updateContact,
  deleteContact,
  contactMatchesSearch,
} from '../services/contactService';
import ContactCard from './ContactCard';
import ContactForm from './ContactForm';
import ContactDetailsModal from './ContactDetailsModal';
import './ContactCard.css';
import './Contacts.css';

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'shared', label: 'Shared' },
  { key: 'mine', label: 'Mine' },
  { key: 'donors', label: 'Donors' },
  { key: 'agencies', label: 'Agencies' },
  { key: 'schools', label: 'Schools' },
  { key: 'vendors', label: 'Vendors' },
];

function contactMatchesChip(contact, chip, userUid) {
  switch (chip) {
    case 'all':
      return true;
    case 'shared':
      return contact.visibility === 'shared';
    case 'mine':
      return contact.ownerUid === userUid;
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

export default function Contacts() {
  const { user, profile } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const [viewContact, setViewContact] = useState(null);
  const [editContact, setEditContact] = useState(null);

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

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) =>
          contactMatchesSearch(c, search) &&
          contactMatchesChip(c, activeChip, user.uid)
      ),
    [contacts, search, activeChip, user.uid]
  );

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

  if (editContact) {
    return (
      <div>
        <h1 className="page-title">Edit Contact</h1>
        <ContactForm
          initialData={editContact}
          onSubmit={handleUpdate}
          onCancel={() => setEditContact(null)}
          submitLabel="Update Contact"
        />
      </div>
    );
  }

  return (
    <div className="contacts-page">
      <h1 className="page-title">Contacts</h1>
      <p className="page-subtitle">Browse and manage squadron contacts</p>

      <div className="contacts-search-sticky">
        <input
          type="search"
          className="search-bar-large"
          placeholder="Filter contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filter contacts"
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
            onClick={() => setActiveChip(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty-message">Loading contacts…</p>
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
          onShare={viewContact.ownerUid === user.uid && viewContact.visibility !== 'shared' ? handleShare : undefined}
        />
      )}
    </div>
  );
}
