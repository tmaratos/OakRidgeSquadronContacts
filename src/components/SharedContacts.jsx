import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getSharedContacts,
  updateContact,
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

export default function SharedContacts() {
  const { user, profile } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [viewContact, setViewContact] = useState(null);
  const [editContact, setEditContact] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSharedContacts();
      setContacts(data);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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

  const canEdit = (contact) => contact.ownerUid === user.uid;

  const handleUpdate = async (formData) => {
    await updateContact(editContact.id, formData, { uid: user.uid, profile }, editContact);
    setEditContact(null);
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
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Shared Contacts</h1>
          <p className="page-subtitle">Contacts shared across Oak Ridge Composite Squadron TN-170</p>
        </div>
        <ImportContactsButton onClick={() => setShowImport(true)} />
      </div>

      <ContactFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        organizations={organizations}
        showVisibilityFilter={false}
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
              canEdit={canEdit}
              showOwner
            />
          </div>
          <div className="mobile-cards-only contact-cards-grid">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onView={setViewContact}
                onEdit={canEdit(contact) ? setEditContact : undefined}
                showOwner
              />
            ))}
            {!filteredContacts.length && <p className="empty-message">No shared contacts found.</p>}
          </div>
        </>
      )}

      {viewContact && (
        <ContactDetailsModal
          contact={viewContact}
          onClose={() => setViewContact(null)}
          canEdit={canEdit(viewContact)}
          onEdit={
            canEdit(viewContact)
              ? (c) => {
                  setViewContact(null);
                  setEditContact(c);
                }
              : undefined
          }
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
