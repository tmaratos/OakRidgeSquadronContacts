import {
  getPrimaryEmail,
  getPrimaryPhone,
  getPreferredMethodLabel,
} from '../services/contactService';
import './ContactCard.css';

export default function ContactCard({ contact, onView, onEdit, onDelete, showOwner }) {
  const primaryEmail = getPrimaryEmail(contact);
  const primaryPhone = getPrimaryPhone(contact);
  const orgTitle = [contact.organization, contact.title].filter(Boolean).join(' — ');
  const ownerLabel = contact.visibility === 'shared' && contact.sharedBy
    ? contact.sharedBy
    : contact.ownerDisplayName;

  return (
    <div className="contact-card card">
      <div className="contact-card-header">
        <div>
          <h3>{contact.name}</h3>
          {orgTitle && <p className="contact-org-title">{orgTitle}</p>}
        </div>
        <span className={`badge badge-${contact.visibility}`}>{contact.visibility}</span>
      </div>

      <div className="contact-card-details">
        {primaryEmail && (
          <p><strong>Email:</strong> {primaryEmail.value}</p>
        )}
        {primaryPhone && (
          <p><strong>Phone:</strong> {primaryPhone.value}</p>
        )}
        <p><strong>Preferred:</strong> {getPreferredMethodLabel(contact.preferredContactMethod)}</p>
        <p><strong>Category:</strong> {contact.category || '—'}</p>
        <p><strong>Type:</strong> {contact.contactType}</p>
        {(contact.tags || []).length > 0 && (
          <p><strong>Tags:</strong> {(contact.tags || []).join(', ')}</p>
        )}
        {contact.nextFollowUpDate && (
          <p><strong>Follow-Up:</strong> {contact.nextFollowUpDate}</p>
        )}
        {showOwner && ownerLabel && (
          <p><strong>{contact.visibility === 'shared' ? 'Shared by' : 'Owner'}:</strong> {ownerLabel}</p>
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
