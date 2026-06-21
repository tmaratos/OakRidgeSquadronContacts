import {
  getPrimaryEmail,
  getPrimaryPhone,
  getPreferredMethodLabel,
} from '../services/contactService';
import './ContactDetailsModal.css';

function digitsOnly(value) {
  return (value || '').replace(/\D/g, '');
}

export default function ContactDetailsModal({
  contact,
  onClose,
  canEdit,
  onEdit,
  onDelete,
  onShare,
}) {
  if (!contact) return null;

  const primaryEmail = getPrimaryEmail(contact);
  const primaryPhone = getPrimaryPhone(contact);
  const orgTitle = [contact.organization, contact.title].filter(Boolean).join(' — ');
  const phoneDigits = primaryPhone ? digitsOnly(primaryPhone.value) : '';

  return (
    <div className="modal-overlay contact-sheet-overlay" onClick={onClose}>
      <div className="modal-content contact-sheet card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{contact.name}</h2>
            {orgTitle && <p className="modal-org-title">{orgTitle}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {(primaryPhone || primaryEmail) && (
          <div className="contact-action-links">
            {primaryPhone && phoneDigits && (
              <>
                <a href={`tel:${phoneDigits}`} className="contact-action-btn">
                  Call
                </a>
                <a href={`sms:${phoneDigits}`} className="contact-action-btn">
                  Text
                </a>
              </>
            )}
            {primaryEmail && (
              <a href={`mailto:${primaryEmail.value}`} className="contact-action-btn">
                Email
              </a>
            )}
          </div>
        )}

        <div className="modal-body">
          {contact.organization && (
            <p className="detail-row"><strong>Organization:</strong> {contact.organization}</p>
          )}
          {contact.title && (
            <p className="detail-row"><strong>Title:</strong> {contact.title}</p>
          )}

          {(contact.emails || []).length > 0 && (
            <div className="detail-section">
              <h3>Emails</h3>
              <ul>
                {(contact.emails || []).map((e, i) => (
                  <li key={i}>
                    {e.isPrimary && <span className="primary-star">★</span>}
                    <strong>{e.label}:</strong>{' '}
                    <a href={`mailto:${e.value}`}>{e.value}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(contact.phones || []).length > 0 && (
            <div className="detail-section">
              <h3>Phones</h3>
              <ul>
                {(contact.phones || []).map((p, i) => (
                  <li key={i}>
                    {p.isPrimary && <span className="primary-star">★</span>}
                    <strong>{p.label}:</strong>{' '}
                    <a href={`tel:${digitsOnly(p.value)}`}>{p.value}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="detail-row">
            <strong>Preferred:</strong> {getPreferredMethodLabel(contact.preferredContactMethod)}
          </p>

          <div className="detail-grid">
            <p><strong>Type:</strong> {contact.contactType}</p>
            <p><strong>Category:</strong> {contact.category}</p>
            <p><strong>Visibility:</strong> {contact.visibility}</p>
          </div>

          {(contact.tags || []).length > 0 && (
            <div className="detail-section">
              <h3>Tags</h3>
              <div className="tag-list">
                {(contact.tags || []).map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {contact.notes && (
            <div className="detail-section">
              <h3>Notes</h3>
              <p className="notes-text">{contact.notes}</p>
            </div>
          )}

          {contact.ownerDisplayName && (
            <p className="detail-row owner-info">
              <strong>Owner:</strong> {contact.ownerDisplayName}
              {contact.sharedBy && contact.visibility === 'shared' && (
                <> · Shared by {contact.sharedBy}</>
              )}
            </p>
          )}
        </div>

        <div className="modal-footer">
          {canEdit && onEdit && (
            <button type="button" className="btn btn-primary" onClick={() => onEdit(contact)}>
              Edit
            </button>
          )}
          {canEdit && onShare && (
            <button type="button" className="btn btn-secondary" onClick={() => onShare(contact)}>
              Share with Squadron
            </button>
          )}
          {canEdit && onDelete && (
            <button type="button" className="btn btn-danger" onClick={() => onDelete(contact)}>
              Delete
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
