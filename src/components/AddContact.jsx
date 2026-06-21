import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createContact } from '../services/contactService';
import ContactForm from './ContactForm';
import ImportContacts, { ImportContactsButton } from './ImportContacts';

export default function AddContact() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showImport, setShowImport] = useState(false);

  const handleCreate = async (formData) => {
    await createContact(formData, { uid: user.uid, profile });
    navigate('/contacts');
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Add Contact</h1>
          <p className="page-subtitle">Create a new contact entry</p>
        </div>
        <div className="page-header-actions">
          <ImportContactsButton onClick={() => setShowImport(true)} />
        </div>
      </div>

      <ContactForm
        onSubmit={handleCreate}
        onCancel={() => navigate('/contacts')}
        submitLabel="Create Contact"
      />

      <ImportContacts open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
