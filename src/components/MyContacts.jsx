import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyContacts,
  createContact,
  updateContact,
  deleteContact,
  contactMatchesSearch,
  contactMatchesFilters,
} from '../services/contactService';
import { getUniqueOrganizations } from '../utils/searchUtils';
import ContactFilters, { emptyFilters } from './ContactFilters';
import ContactTable from './ContactTable';
import ContactCard from './ContactCard';
import ContactForm from './ContactForm';
import ContactDetailsModal from './ContactDetailsModal';
import ImportContacts, { ImportContactsButton } from './ImportContacts';
import './ContactCard.css';
import './pages.css';

export default function MyContacts() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [viewContact, setViewContact] = useState(null);
  const [editContact, setEditContact] = useState(null);
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
  const [showImport, setShowImport] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyContacts(user.uid);
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

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) => contactMatchesSearch(c, search) && contactMatchesFilters(c, filters)
      ),
    [contacts, search, filters]
  );

  const organizations = useMemo(
    () => getUniqueOrganizations(contacts),
    [contacts]
  );

  const handleCreate = async (formData) => {
    await createContact(formData, { uid: user.uid, profile });
    setShowForm(false);
    await loadContacts();
  };

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

  if (showForm) {
    return (
      <div>
        <h1 className="page-title">Add Contact</h1>
        <ContactForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitLabel="Create Contact" />
      </div>
    );
  }

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
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">My Contacts</h1>
          <p className="page-subtitle">Manage your private and shared contacts</p>
        </div>
        <div className="page-header-actions">
          <ImportContactsButton onClick={() => setShowImport(true)} />
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add Contact
          </button>
        </div>
      </div>

      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        organizations={organizations}
        onImport={() => setShowImport(true)}
      />

      {loading ? (
        <p className="empty-message">Loading contacts…</p>
      ) : (
        <>
          <div className="desktop-table-only card">
            <ContactTable
              contacts={filteredContacts}
              onView={setViewContact}
              onEdit={setEditContact}
              onDelete={handleDelete}
            />
          </div>
          <div className="mobile-cards-only contact-cards-grid">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onView={setViewContact}
                onEdit={setEditContact}
                onDelete={handleDelete}
              />
            ))}
            {!filteredContacts.length && <p className="empty-message">No contacts found.</p>}
          </div>
        </>
      )}

      {viewContact && (
        <ContactDetailsModal
          contact={viewContact}
          onClose={() => setViewContact(null)}
          canEdit
          onEdit={(c) => {
            setViewContact(null);
            setEditContact(c);
          }}
        />
      )}

      <ImportContacts
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={loadContacts}
      />
    </div>
  );
}
