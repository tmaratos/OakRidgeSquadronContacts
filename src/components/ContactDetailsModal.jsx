import {
  getPreferredMethodLabel,
} from '../services/contactService';
import './ContactDetailsModal.css';

export default function ContactDetailsModal({ contact, onClose, canEdit, onEdit }) {
  if (!contact) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{contact.name}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {contact.organization && (
            <p className="detail-row"><strong>Organization:</strong> {contact.organization}</p>
          )}
          {contact.title && (
            <p className="detail-row"><strong>Title:</strong> {contact.title}</p>
          )}

          <div className="detail-section">
            <h3>Emails</h3>
            {(contact.emails || []).length ? (
              <ul>
                {contact.emails.map((e, i) => (
                  <li key={i}>
                    {e.isPrimary && <span className="primary-star">★</span>}
                    <strong>{e.label}:</strong> {e.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">No emails</p>
            )}
          </div>

          <div className="detail-section">
            <h3>Phones</h3>
            {(contact.phones || []).length ? (
              <ul>
                {contact.phones.map((p, i) => (
                  <li key={i}>
                    {p.isPrimary && <span className="primary-star">★</span>}
                    <strong>{p.label}:</strong> {p.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">No phones</p>
            )}
          </div>

          <p className="detail-row">
            <strong>Preferred Contact:</strong>{' '}
            {getPreferredMethodLabel(contact.preferredContactMethod)}
          </p>

          {contact.website && (
            <p className="detail-row">
              <strong>Website:</strong>{' '}
              <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" rel="noopener noreferrer">
                {contact.website}
              </a>
            </p>
          )}

          {(contact.address || contact.city) && (
            <p className="detail-row">
              <strong>Address:</strong>{' '}
              {[contact.address, contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}
            </p>
          )}

          <div className="detail-grid">
            <p><strong>Type:</strong> {contact.contactType}</p>
            <p><strong>Category:</strong> {contact.category}</p>
            <p><strong>Visibility:</strong> {contact.visibility}</p>
            {contact.relationshipOwner && (
              <p><strong>Relationship Owner:</strong> {contact.relationshipOwner}</p>
            )}
            {contact.source && <p><strong>Source:</strong> {contact.source}</p>}
            {contact.lastContactDate && (
              <p><strong>Last Contact:</strong> {contact.lastContactDate}</p>
            )}
            {contact.nextFollowUpDate && (
              <p><strong>Next Follow-Up:</strong> {contact.nextFollowUpDate}</p>
            )}
          </div>

          {(contact.tags || []).length > 0 && (
            <div className="detail-section">
              <h3>Tags</h3>
              <div className="tag-list">
                {contact.tags.map((tag, i) => (
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
              <strong>Contact Owner:</strong> {contact.ownerDisplayName}
              {contact.sharedBy && contact.visibility === 'shared' && (
                <> · Shared by {contact.sharedBy}</>
              )}
            </p>
          )}
        </div>

        <div className="modal-footer">
          {canEdit && onEdit && (
            <button type="button" className="btn btn-primary" onClick={() => onEdit(contact)}>
              Edit Contact
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
