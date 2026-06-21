import {
  getPrimaryEmail,
  getPrimaryPhone,
  getPreferredMethodLabel,
} from '../services/contactService';
import './ContactTable.css';

function ContactNameCell({ contact, onView }) {
  const orgTitle = [contact.organization, contact.title].filter(Boolean).join(' — ');

  return (
    <div className="contact-name-cell">
      <button type="button" className="link-btn" onClick={() => onView(contact)}>
        {contact.name}
      </button>
      {orgTitle && <span className="contact-subline">{orgTitle}</span>}
    </div>
  );
}

export default function ContactTable({ contacts, onView, onEdit, onDelete, showOwner, canEdit }) {
  if (!contacts.length) {
    return <p className="empty-message">No contacts found.</p>;
  }

  return (
    <div className="contact-table-wrap">
      <table className="contact-table">
        <thead>
          <tr>
            <th>Contact</th>
            <th>Primary Email</th>
            <th>Primary Phone</th>
            <th>Preferred</th>
            <th>Category</th>
            <th>Type</th>
            <th>Tags</th>
            <th>Follow-Up</th>
            <th>Visibility</th>
            {showOwner && <th>Owner</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const primaryEmail = getPrimaryEmail(contact);
            const primaryPhone = getPrimaryPhone(contact);
            const ownerLabel = contact.visibility === 'shared' && contact.sharedBy
              ? contact.sharedBy
              : contact.ownerDisplayName;

            return (
              <tr key={contact.id}>
                <td>
                  <ContactNameCell contact={contact} onView={onView} />
                </td>
                <td>{primaryEmail?.value || '—'}</td>
                <td>{primaryPhone?.value || '—'}</td>
                <td>{getPreferredMethodLabel(contact.preferredContactMethod)}</td>
                <td>{contact.category || '—'}</td>
                <td>{contact.contactType}</td>
                <td>
                  {(contact.tags || []).length ? (
                    <span className="table-tags">{(contact.tags || []).join(', ')}</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{contact.nextFollowUpDate || '—'}</td>
                <td>
                  <span className={`badge badge-${contact.visibility}`}>
                    {contact.visibility}
                  </span>
                </td>
                {showOwner && <td>{ownerLabel || '—'}</td>}
                <td className="actions-cell">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onView(contact)}>
                    View
                  </button>
                  {onEdit && (!canEdit || canEdit(contact)) && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEdit(contact)}>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(contact)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
