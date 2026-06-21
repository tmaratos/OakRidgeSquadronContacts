import {
  getPrimaryEmail,
  getPrimaryPhone,
  getPreferredMethodLabel,
} from '../services/contactService';
import './ContactCard.css';

export default function ContactCard({ contact, onView, onEdit, onDelete, showOwner }) {
  const primaryEmail = getPrimaryEmail(contact);
  const primaryPhone = getPrimaryPhone(contact);

  return (
    <div className="contact-card card">
      <div className="contact-card-header">
        <h3>{contact.name}</h3>
        <span className={`badge badge-${contact.visibility}`}>{contact.visibility}</span>
      </div>

      {contact.organization && (
        <p className="contact-org">{contact.organization}</p>
      )}

      <div className="contact-card-details">
        {primaryEmail && (
          <p><strong>Email:</strong> {primaryEmail.value}</p>
        )}
        {primaryPhone && (
          <p><strong>Phone:</strong> {primaryPhone.value}</p>
        )}
        <p><strong>Preferred:</strong> {getPreferredMethodLabel(contact.preferredContactMethod)}</p>
        <p><strong>Type:</strong> {contact.contactType}</p>
        {showOwner && contact.ownerDisplayName && (
          <p><strong>Owner:</strong> {contact.ownerDisplayName}</p>
        )}
      </div>

      <div className="contact-card-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onView(contact)}>
          View
        </button>
        {onEdit && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(contact)}>
            Edit
          </button>
        )}
        {onDelete && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(contact)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
