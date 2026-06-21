import {
  getPrimaryEmail,
  getPrimaryPhone,
} from '../services/contactService';
import './ContactCard.css';

export default function ContactCard({ contact, onView, showOwner }) {
  const primaryEmail = getPrimaryEmail(contact);
  const primaryPhone = getPrimaryPhone(contact);
  const orgTitle = [contact.organization, contact.title].filter(Boolean).join(' — ');
  const ownerLabel = contact.visibility === 'shared' && contact.sharedBy
    ? contact.sharedBy
    : contact.ownerDisplayName;

  return (
    <button
      type="button"
      className="contact-card card contact-card-tappable"
      onClick={() => onView(contact)}
    >
      <div className="contact-card-header">
        <div>
          <h3>{contact.name}</h3>
          {orgTitle && <p className="contact-org-title">{orgTitle}</p>}
        </div>
        <span className={`badge badge-${contact.visibility}`}>{contact.visibility}</span>
      </div>

      <div className="contact-card-details">
        {primaryPhone && (
          <p><strong>Phone:</strong> {primaryPhone.value}</p>
        )}
        {primaryEmail && (
          <p><strong>Email:</strong> {primaryEmail.value}</p>
        )}
        {contact.category && (
          <p><strong>Category:</strong> {contact.category}</p>
        )}
        {showOwner && ownerLabel && (
          <p><strong>{contact.visibility === 'shared' ? 'Shared by' : 'Owner'}:</strong> {ownerLabel}</p>
        )}
      </div>
    </button>
  );
}
