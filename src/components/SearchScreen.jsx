import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getVisibleContacts,
  contactMatchesSearch,
  updateContact,
  deleteContact,
} from '../services/contactService';
import ContactCard from './ContactCard';
import ContactForm from './ContactForm';
import ContactDetailsModal from './ContactDetailsModal';
import './ContactCard.css';
import './SearchScreen.css';

export default function SearchScreen() {
  const { user, profile } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const results = useMemo(() => {
    if (!search.trim()) return [];
    return contacts.filter((c) => contactMatchesSearch(c, search));
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
    <div className="search-screen">
      <h1 className="page-title">Search</h1>
      <p className="page-subtitle">Find contacts by name, organization, phone, or email</p>

      <div className="search-bar-sticky">
        <input
          type="search"
          className="search-bar-large"
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search contacts"
        />
      </div>

      {loading ? (
        <p className="empty-message">Loading contacts…</p>
      ) : !search.trim() ? (
        <p className="empty-message search-hint">Type to search across all visible contacts.</p>
      ) : results.length ? (
        <div className="contact-cards-grid">
          {results.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onView={setViewContact}
              showOwner
            />
          ))}
        </div>
      ) : (
        <p className="empty-message">No contacts match &ldquo;{search}&rdquo;.</p>
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
